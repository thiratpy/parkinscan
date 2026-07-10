import os
import glob
import warnings
import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
from PIL import Image
import timm
from sklearn.metrics import roc_auc_score, confusion_matrix, roc_curve
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# --- 1. ENVIRONMENT & WARNING SUPPRESSION ---
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
warnings.filterwarnings("ignore", category=FutureWarning)

# --- 2. CONFIGURATION ---
DATA_DIR = "/kaggle/input/datasets/irfansheriff/parkinsons-brain-mri-dataset/parkinsons_dataset"
BATCH_SIZE = 32
PHASE_1_EPOCHS = 10  # Frozen backbone warmup
PHASE_2_EPOCHS = 40  # Unfrozen fine-tuning
TOTAL_EPOCHS = PHASE_1_EPOCHS + PHASE_2_EPOCHS
PATIENCE = 10        # Early stopping threshold
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_SAVE_PATH = '/kaggle/working/parkinsons_efficientnet_prod.pth'

# --- 3. MEDICAL PREPROCESSING & CROP ---
def crop_and_enhance_mri(img_path):
    """Applies CLAHE contrast enhancement, crops dead space, returns 3-channel PIL Image."""
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    img = clahe.apply(img)
    
    _, thresh = cv2.threshold(img, 5, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(c)
        img = img[y:y+h, x:x+w]
        
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(img)

# --- 4. DATASET & STRATIFIED SPLIT ---
class ParkinsonDataset(Dataset):
    def __init__(self, file_paths, labels, transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        img_path = self.file_paths[idx]
        image = crop_and_enhance_mri(img_path)
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(self.labels[idx], dtype=torch.long)

# Load files
normal_files = glob.glob(os.path.join(DATA_DIR, 'normal', '*.png'))
parkinson_files = glob.glob(os.path.join(DATA_DIR, 'parkinson', '*.png'))

all_files = normal_files + parkinson_files
all_labels = [0] * len(normal_files) + [1] * len(parkinson_files)

train_files, val_files, train_labels, val_labels = train_test_split(
    all_files, all_labels, test_size=0.2, stratify=all_labels, random_state=42
)

# --- 5. AUGMENTATIONS & SAMPLER ---
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(15), 
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

train_dataset = ParkinsonDataset(train_files, train_labels, transform=train_transform)
val_dataset = ParkinsonDataset(val_files, val_labels, transform=val_transform)

class_counts = [train_labels.count(0), train_labels.count(1)]
class_weights = 1. / torch.tensor(class_counts, dtype=torch.float)
sample_weights = [class_weights[label] for label in train_labels]
sampler = WeightedRandomSampler(weights=sample_weights, num_samples=len(sample_weights), replacement=True)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler, num_workers=0, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

# --- 6. MODEL & LOSS SETUP ---
model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=2)

for param in model.parameters():
    param.requires_grad = False
for param in model.classifier.parameters():
    param.requires_grad = True

model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-2)
scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=5, T_mult=1)

scaler = torch.amp.GradScaler('cuda')

# --- 7. TRAINING LOOP ---
print("🚀 Starting Production-Grade Two-Phase Training...")
best_auc = 0.0
epochs_no_improve = 0

for epoch in range(TOTAL_EPOCHS):
    
    # --- PHASE 2 TRIGGER ---
    if epoch == PHASE_1_EPOCHS:
        print("\n🔥 PHASE 2: Unfreezing top backbone blocks for fine-tuning...")
        for param in model.blocks[-3:].parameters():
            param.requires_grad = True
            
        optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-5, weight_decay=1e-3)
        scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=1)

    model.train()
    running_loss = 0.0
    
    train_pbar = tqdm(train_loader, desc=f"Epoch [{epoch+1}/{TOTAL_EPOCHS}] Train", leave=False)
    
    for images, labels in train_pbar:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        
        with torch.amp.autocast('cuda'):
            outputs = model(images)
            loss = criterion(outputs, labels)
            
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        
        running_loss += loss.item()
        train_pbar.set_postfix({'loss': f"{loss.item():.4f}"})
        
    scheduler.step()
    avg_train_loss = running_loss / len(train_loader)
    
    # --- VALIDATION ---
    model.eval()
    val_running_loss = 0.0
    val_labels_list = []
    val_probs_list = []
    
    # TQDM Live Validation Bar
    val_pbar = tqdm(val_loader, desc=f"Epoch [{epoch+1}/{TOTAL_EPOCHS}] Val  ", leave=False)
    
    with torch.no_grad():
        for images, labels in val_pbar:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            with torch.amp.autocast('cuda'):
                outputs = model(images)
                v_loss = criterion(outputs, labels)
            
            val_running_loss += v_loss.item()
            probs = torch.softmax(outputs, dim=1)[:, 1]
            
            val_labels_list.extend(labels.cpu().numpy())
            val_probs_list.extend(probs.cpu().numpy())
            
    avg_val_loss = val_running_loss / len(val_loader)
            
    fpr, tpr, thresholds = roc_curve(val_labels_list, val_probs_list)
    optimal_idx = np.argmax(tpr - fpr)
    optimal_threshold = thresholds[optimal_idx]
    
    val_preds_list = [1 if p >= optimal_threshold else 0 for p in val_probs_list]
    
    tn, fp, fn, tp = confusion_matrix(val_labels_list, val_preds_list).ravel()
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    try:
        auc = roc_auc_score(val_labels_list, val_probs_list)
    except ValueError:
        auc = 0.0
        
    print(f"Epoch [{epoch+1}/{TOTAL_EPOCHS}] "
          f"Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | "
          f"Opt Thresh: {optimal_threshold:.2f} | Acc: {accuracy*100:.1f}% | "
          f"Sens: {sensitivity*100:.1f}% | Spec: {specificity*100:.1f}% | AUC: {auc:.3f}")
    
    # Checkpointing & Early Stopping
    if auc > best_auc:
        best_auc = auc
        epochs_no_improve = 0
        torch.save(model.state_dict(), MODEL_SAVE_PATH)
    else:
        epochs_no_improve += 1
        
    if epochs_no_improve >= PATIENCE and epoch >= PHASE_1_EPOCHS:
        print(f"\n🛑 Early stopping triggered. Validation AUC hasn't improved in {PATIENCE} epochs.")
        break

print(f"\n✅ Training complete! Best Validation AUC: {best_auc:.3f}")
print(f"Model saved to: {MODEL_SAVE_PATH}")

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeScan(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Analysis failed (${response.status})`);
  }

  return response.json();
}

export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

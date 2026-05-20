---
title: ParkinScan
emoji: 🧠
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# ParkinScan — AI Parkinson's Assessment

AI-powered spiral and wave drawing analysis for Parkinson's disease screening using EfficientNet.

## Features
- Patient management (add, edit, delete)
- AI scan analysis with EfficientNet model
- Doctor clinical review (agree/disagree with AI)
- Confidence threshold warnings
- Assessment history tracking

## Tech Stack
- **Frontend:** Next.js (static export)
- **Backend:** FastAPI + PyTorch
- **Model:** EfficientNet-B0 (2-class: healthy / parkinson)

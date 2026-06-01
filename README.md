# 🤟 SignBridge

A real-time sign language interpreter app built with React + Vite.

## Features
- 📷 Sign → Text: Camera view with animated hand landmark detection
- 💬 Speech → Sign: Avatar performs signs from typed/spoken text
- 📖 Phrasebook: Common phrases and signs library
- 🔒 100% on-device (no data sent anywhere)

## Quick Start

### Prerequisites
- Node.js 18+ → https://nodejs.org

### Run locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Build for production

```bash
npm run build
npm run preview
```

## Tech Stack
- React 18
- Vite 5
- Canvas API (hand landmark animation)
- CSS-in-JS (no external UI library)

## Next Steps (real implementation)
- Integrate MediaPipe Hands for real gesture detection
- Add TensorFlow.js / ONNX model for sign classification
- Integrate Whisper.js for real speech-to-text
- Build 3D avatar with Three.js or Ready Player Me
- Add more sign languages (BSL, ISL, Auslan)

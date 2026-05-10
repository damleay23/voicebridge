<div align="center">

# 🤟 VoiceBridge

### AI-powered Sign Language Learning Platform with Blockchain Rewards on Solana

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-WASM-00897B?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-Framework-FF6B35?style=for-the-badge)](https://anchor-lang.com)

**VoiceBridge** teaches the American Sign Language (ASL) alphabet through real-time AI recognition, gamified progression, and on-chain achievement rewards — all running in the browser with no plugins required.

</div>

---

## 🚀 The Problem

Over 70 million people worldwide use sign language as their primary means of communication, yet accessible, interactive tools for learning it remain scarce. Traditional methods lack real-time feedback, and existing apps don't leverage modern AI or provide meaningful incentives to keep learners engaged.

## 💡 Our Solution

VoiceBridge combines three technologies into a single learning loop:

1. **Real-time AI recognition** — MediaPipe hand tracking (GPU-accelerated, runs in the browser via WASM) extracts 21 hand landmarks per frame and sends them to a custom TensorFlow model trained on 90,000+ images across 30 ASL signs.
2. **Gamified learning** — XP, levels, streaks, achievements, practice modes, and exams keep learners motivated.
3. **Blockchain rewards** — Progress milestones are recorded on a Solana smart contract (Anchor framework), making achievements verifiable and permanent on-chain.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React + Vite)               │
│                                                          │
│  Camera → MediaPipe WASM (GPU) → 63 landmarks           │
│                    ↓                                     │
│           WebSocket (ws://localhost:3000/ws)             │
└──────────────────────┬──────────────────────────────────┘
                       │ proxy
┌──────────────────────▼──────────────────────────────────┐
│              Python WebSocket Server (port 8000)         │
│                                                          │
│   Receives 63 floats → TensorFlow model_sign.h5         │
│   → prediction + confidence → confirmed after 5x streak │
└──────────────────────┬──────────────────────────────────┘
                       │ (future)
┌──────────────────────▼──────────────────────────────────┐
│              Solana Devnet (Anchor Program)               │
│   Program ID: AELiTsxMv5D4W8bwJA4YvpsrGAc8wvcbskn7Cnsmec86 │
│   PlayerStats { username, level, xp }                   │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Real-time ASL detection** | 30 signs (A–Z + space, del, nothing) recognized at 20fps |
| 🎯 **Smart confirmation** | A sign is confirmed only after 5 consecutive consistent detections with ≥75% confidence |
| ⏱️ **Anti-spam cooldown** | 3-second pause between detections prevents audio/XP flooding |
| 🎮 **Gamification** | XP system, levels (Beginner → Expert), streaks, and 10+ achievements |
| 📚 **Multiple modes** | Learn, Practice, Exam, and Free mode |
| 🔊 **Voice feedback** | Text-to-speech announces each detected letter and milestone |
| ⛓️ **On-chain progress** | Player stats stored on Solana via Anchor smart contract |
| 🖐️ **Live hand overlay** | Real-time landmark visualization drawn on canvas at 60fps |

---

## 🧠 AI Model

The classification model was trained entirely from scratch:

- **Dataset**: 90,000+ hand sign images (3,000 per class × 30 classes)
- **Feature extraction**: MediaPipe Hands extracts 21 3D landmarks (63 values) per image
- **Architecture**: Dense neural network — `Input(63) → Dense(128, ReLU) → Dropout(0.3) → Dense(64, ReLU) → Dropout(0.2) → Softmax(30)`
- **Training**: 80 epochs, Adam optimizer, categorical cross-entropy
- **Classes**: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z + `space` `del` `nothing`

The key insight: instead of sending raw video frames over WebSocket (slow, bandwidth-heavy), MediaPipe runs **in the browser on GPU** and only the 63 landmark coordinates are sent to the Python server — reducing payload from ~15KB/frame to ~500 bytes/frame.

---

## 📁 Project Structure

```
voicebridge/                    # Frontend (React + Vite + TypeScript)
├── src/
│   ├── context/
│   │   └── LetterContext.tsx   # Core state: MediaPipe loop, WebSocket, game logic
│   ├── components/
│   │   ├── CameraView.tsx      # Live camera feed + HUD
│   │   ├── HandOverlay.tsx     # Canvas landmark renderer (rAF loop)
│   │   ├── PracticaView.tsx    # Practice mode
│   │   ├── ExamenView.tsx      # Exam mode
│   │   └── LibreView.tsx       # Free mode
│   ├── data/
│   │   ├── alphabet.ts         # 26 ASL letter definitions
│   │   └── achievements.ts     # Achievement definitions and unlock logic
│   └── hooks/
│       └── useVoice.ts         # Text-to-speech hook
│
backend/                        # Python WebSocket server + AI pipeline
├── server.py                   # WebSocket server (port 8000)
├── 01_extract_features.py      # Dataset feature extraction with MediaPipe
├── 02_train_model.py           # TensorFlow model training
├── 03_real_time_game.py        # Standalone OpenCV demo
├── 04_real_time_test.py        # Model testing script
├── 05_player_stats.py          # Local leaderboard (pandas)
├── 06_blockchain_inspector.py  # Read PlayerStats from Solana
├── models/
│   ├── model_sign.h5           # Trained TensorFlow model
│   └── classes.pkl             # Label encoder classes
└── contract/
    └── sign_language_rewards/  # Anchor (Rust) smart contract
        └── programs/
            └── src/
                └── lib.rs      # initialize_player + update_level instructions
```

---

## ⚙️ Setup & Running

### Prerequisites

- Node.js 18+
- Python 3.10+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/damleay23/voicebridge.git
cd voicebridge
```

### 2. Start the Python backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The server loads `models/model_sign.h5` and listens on `ws://0.0.0.0:8000`.

### 3. Start the frontend

```bash
cd voicebridge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite dev server proxies `/ws` to the Python backend automatically.

### 4. Allow camera access

Click the camera button in the app. Show your hand and start signing!

---

## 🔗 Blockchain Component (Solana Devnet)

The Anchor smart contract stores player progress on-chain.

**Program ID**: `AELiTsxMv5D4W8bwJA4YvpsrGAc8wvcbskn7Cnsmec86`

**Instructions**:
- `initialize_player(username)` — creates a `PlayerStats` account for a new user
- `update_level(new_level)` — updates the player's level on-chain when they level up

**Inspect on-chain data**:
```bash
cd backend
python 06_blockchain_inspector.py
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Hand tracking | MediaPipe Tasks Vision (WASM, GPU delegate) |
| AI model | TensorFlow / Keras (H5 format) |
| Backend | Python 3.10, websockets, NumPy |
| Blockchain | Solana Devnet, Anchor Framework (Rust) |
| Animations | Motion (Framer Motion) |
| Voice | Web Speech API |

---

## 👥 Team

Built with ❤️ for the hackathon.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

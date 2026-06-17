# ⚡ fastHLD

> *"Design me Twitter's architecture."*
> Candidate opens whiteboard. Draws a rectangle. Labels it "Client". Draws another rectangle. Labels it "Server". Nervously reaches for the marker again…
>
> **Meanwhile, the interviewer is already bored.**

**fastHLD** ends the box-drawing theatre. Just talk — or type — and your High Level Design diagram builds itself in real time. More time thinking. Less time being a human Visio.

![fastHLD logo](./frontend/public/logo.svg)

---

## What is it?

fastHLD is a voice-and-text driven system design tool that converts natural language into interactive architecture diagrams. It knows 53 services out of the box — AWS, GCP, Azure, open-source tools, and generic components — and understands how they connect.

**Perfect for:**
- **Technical interviews** — stop wasting precious minutes on boxes, start discussing trade-offs
- **Architecture discussions** — sketch ideas at the speed you think them
- **Design reviews** — narrate changes, diagram updates live

---

## ⚡ The 30-second demo

1. Hold **Space** and say *"Add an EC2 instance connected to an RDS database behind an ALB"*
2. Watch three nodes and two edges appear instantly
3. Say *"Add ElastiCache in front of RDS"* — done
4. Discuss. Refine. Export.

No mouse required. No awkward silences while you hunt for the right shape.

---

## Features

| Feature | Details |
|---------|---------|
| 🎙️ **Voice input** | Hold `Space` (or the mic button) → speak → release → diagram updates |
| ⌨️ **Text input** | Type your instruction, press `Enter` to send |
| 🤖 **LLM-powered** | Ollama (local, free), OpenAI, or Anthropic — one env var to switch |
| 🗂️ **53 service icons** | AWS (15), GCP (9), Azure (7), open-source (12), generic (10) |
| 🎨 **Dark mode** | Light / Dark / System — toggle top-right |
| ↩️ **Undo/Redo** | Full 50-step history, `Ctrl+Z` works |
| 📦 **Export** | Download diagram as JSON |
| 🗑️ **Delete** | Select node(s) → `Delete` key |

---

## Getting started

### Prerequisites

- Python 3.9+
- Node.js 18+
- [Ollama](https://ollama.ai) (for local LLM — free, runs on your machine)

### 1. Pull the default model

```bash
ollama pull qwen2.5:7b   # ~4.5 GB, excellent at structured JSON output
ollama serve             # start the Ollama server
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env     # defaults work out of the box with Ollama
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**. Verify: `curl http://localhost:8000/api/health`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. Open it in Chrome or Edge (Web Speech API support required for voice).

---

## Switching LLM providers

Set `LLM_PROVIDER` in `backend/.env`. That's the only change needed.

| `LLM_PROVIDER` | Model | What you need |
|----------------|-------|---------------|
| `ollama` *(default)* | `qwen2.5:7b` | Ollama running locally |
| `openai` | `gpt-4o` | `OPENAI_API_KEY` |
| `anthropic` | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |

```bash
# Switch to OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` (hold) | Push-to-talk voice input |
| `Enter` | Send text instruction |
| `Shift+Enter` | Newline in text box |
| `Ctrl+Z` / `⌘Z` | Undo |
| `Delete` | Remove selected node/edge |

---

## Running tests

```bash
# Backend — 29 tests
cd backend
source .venv/bin/activate
python -m pytest -v

# Frontend unit tests — 30 tests
cd frontend
npm test

# Frontend E2E (needs dev server running)
cd frontend
npm run test:e2e
```

---

## Architecture

```
User speech / text
       │
       ▼
 Web Speech API          ← browser-native, no API key
 (text transcript)
       │
       ▼
  FastAPI backend
  POST /api/diagram/instruct
  { instruction, current_diagram_state }
       │
       ▼
  LLM (Ollama / OpenAI / Anthropic)
  returns JSON array of ops:
  [ {"op":"add_node", "type":"aws_ec2", ...}, ... ]
       │
       ▼
  React frontend
  Zustand store → React Flow canvas
```

The LLM always receives the **full current diagram state** so it understands context — "add a cache in front of the database" works because it knows which database already exists.

---

## Interview tips 🎯

- **Open fastHLD before the interview.** Keep it in a browser tab.
- **Narrate as you think.** "I'd put a load balancer in front, connected to a few EC2 instances, with RDS behind them." → diagram appears.
- **Iterate out loud.** "Actually, let's add ElastiCache to reduce DB load." → one sentence, diagram updates.
- **Focus on the why, not the what.** The interviewer already sees the boxes — spend your time explaining trade-offs, failure modes, and scaling strategies.

---

## Project structure

```
fasthld/
├── backend/               # FastAPI + LLM abstraction
│   ├── app/
│   │   ├── api/           # HTTP endpoints
│   │   ├── llm/           # Ollama / OpenAI / Anthropic providers
│   │   ├── models/        # Pydantic schemas
│   │   └── prompts/       # System prompt with full service catalog
│   └── tests/             # 29 pytest tests
└── frontend/              # React + Vite + React Flow
    ├── src/
    │   ├── components/    # Canvas, InputPanel, Sidebar, nodes
    │   ├── hooks/         # useVoiceInput, useDiagramMutation, useTheme
    │   ├── store/         # Zustand diagram store
    │   └── types/         # TypeScript types
    └── tests/e2e/         # Playwright tests
```

---

*Built because life's too short to draw rectangles in interviews.*

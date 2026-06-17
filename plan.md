# fastHLD — Living Todo

## Phase 1 — Project Scaffolding
- [x] Init frontend: `npm create vite@latest frontend -- --template react-ts`
- [x] Install frontend deps: react-flow, zustand, tailwind, simple-icons, lucide-react
- [x] Install frontend test deps: vitest, @testing-library, playwright
- [x] Init backend: FastAPI, uvicorn, httpx, pydantic, python-dotenv
- [x] Write `.env.example` with all env vars
- [x] Write top-level `README.md` with setup instructions

## Phase 2 — Backend Core
- [x] `main.py`: FastAPI app with CORS, lifespan context
- [x] `models/diagram.py`: Pydantic models for DiagramState, DiagramOp, InstructRequest
- [x] `llm/base.py`: Abstract LLMProvider interface
- [x] `llm/ollama_provider.py`: Ollama HTTP client (chat completions)
- [x] `llm/openai_provider.py`: OpenAI SDK wrapper
- [x] `llm/anthropic_provider.py`: Anthropic SDK wrapper
- [x] `llm/factory.py`: `get_provider()` from env
- [x] `prompts/system_prompt.py`: Full system prompt with node catalog and op schema
- [x] `api/diagram.py`: POST `/api/diagram/instruct` endpoint
- [x] `api/health.py`: GET `/api/health` endpoint

## Phase 3 — Frontend Core
- [x] Tailwind v4 + global styles
- [x] `types/diagram.ts`: TypeScript types for ops, nodes, edges
- [x] `store/diagramStore.ts`: Zustand store (nodes, edges, applyOps, undo/redo)
- [x] `services/api.ts`: Typed fetch client
- [x] `hooks/useDiagramMutation.ts`: POST instruction, apply returned ops
- [x] `hooks/useVoiceInput.ts`: Web Speech API, spacebar keybinding, silence detection

## Phase 4 — Icons & Node Types
- [x] `iconRegistry.tsx`: AWS (15), GCP (9), Azure (7), OSS (12), Generic (10) icons
- [x] `nodes/ServiceNode.tsx`: Renders icon + label + React Flow handles
- [x] `nodes/GroupNode.tsx`: Resizable group/VPC container
- [x] `nodes/nodeTypes.ts`: Registry mapping type → component

## Phase 5 — Canvas & UI
- [x] `Canvas/DiagramCanvas.tsx`: React Flow canvas with minimap, controls, color-coded nodes
- [x] `InputPanel/TextInput.tsx`: Textarea with Enter send, Shift+Enter newline
- [x] `InputPanel/VoiceInput.tsx`: Spacebar press-to-talk with visual feedback
- [x] `InputPanel/InputPanel.tsx`: Combined text + voice input with error display
- [x] `Sidebar/NodePalette.tsx`: Categorized palette — click to add node to canvas
- [x] `ui/Toolbar.tsx`: Undo/Redo, Clear, Export JSON, node/edge count
- [x] `App.tsx`: Full layout — toolbar top, palette left, canvas center, input bottom

## Phase 6 — Backend Tests ✅ 29/29
- [x] `tests/test_diagram_api.py`: API integration tests with mock LLM provider
- [x] `tests/test_llm_providers.py`: Unit tests for Ollama provider (mocked HTTP)
- [x] `tests/test_prompt_parsing.py`: Tests for JSON op parsing

## Phase 7 — Frontend Tests ✅ 30/30
- [x] Unit: `diagramStore` — applyOps, undo/redo, snapshot
- [x] Unit: `iconRegistry` — all node types registered
- [x] Component: `TextInput` — submit, enter, shift-enter, disabled state
- [x] Component: `VoiceInput` — supported/unsupported, listening state, callbacks
- [x] E2E (Playwright): `tests/e2e/app.spec.ts` — canvas, palette, undo, toolbar

## Phase 8 — Polish & Docs
- [x] Keyboard shortcuts: Space (voice), Ctrl+Z (undo), Delete (remove selected node)
- [x] Error states: LLM error display, speech API unsupported fallback
- [x] Export diagram as JSON
- [x] `plan.md` updated
- [x] README finalized — `npm run build` compiles cleanly ✓

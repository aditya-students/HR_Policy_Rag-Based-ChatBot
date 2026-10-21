"""FastAPI server for the HR Policy RAG Assistant.

Run with:
    uvicorn server:app --reload --port 8000

Then open  http://localhost:8000  in your browser.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from hr_assistant.logger import get_logger
from hr_assistant.pipeline import ask, build_hr_assistant

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Global agent (initialised once at startup)
# ---------------------------------------------------------------------------
_agent = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _agent
    logger.info("=== Server starting – building HR assistant… ===")
    _agent = build_hr_assistant()
    logger.info("=== HR assistant ready. Server is up! ===")
    yield
    logger.info("=== Server shutting down ===")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="HR Policy Assistant API",
    description="RAG-powered chatbot for Acme Corp HR policies",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (CSS, JS)
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", response_class=FileResponse)
async def serve_ui():
    """Serve the main HTML UI."""
    index_path = Path(__file__).parent / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(str(index_path))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Accept a question and return the HR assistant's answer."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if _agent is None:
        raise HTTPException(status_code=503, detail="Assistant not yet initialised")

    logger.info("=== /chat  question=%r ===", request.question)
    answer = ask(_agent, request.question)
    return ChatResponse(answer=answer)


@app.get("/health")
async def health():
    return JSONResponse({"status": "ok", "agent_ready": _agent is not None})

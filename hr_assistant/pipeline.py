"""RAG pipeline: load → split → embed → store → agent.

This module is intentionally side-effect-free at import time.
Call build_hr_assistant() once to initialise everything, then
pass the returned agent to ask().
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import JinaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

from hr_assistant.logger import get_logger

load_dotenv()

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DATA_FILE = Path(__file__).parent.parent / "data" / "hr_policy.txt"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 3

SYSTEM_PROMPT = """You are a friendly and professional HR assistant working for Acme Corp.

You have access to a tool called search_hr_policy that searches the official company HR policy document.

RULES:
1. ALWAYS call search_hr_policy before answering any HR-related question.
2. Base your answer ONLY on what the tool returns.
3. If the answer is not found in the policy document, say: "I'm sorry, I don't have that information in the current HR policy document."
4. Be concise, warm, and professional.
5. Format your answers clearly with bullet points or numbered lists when appropriate.
"""


# ---------------------------------------------------------------------------
# Build the assistant (called once, cached by the server)
# ---------------------------------------------------------------------------
def build_hr_assistant():
    """Load the HR policy document and return a ready-to-use agent."""
    logger.info("Building HR assistant …")

    # 1. Load document
    loader = TextLoader(str(DATA_FILE), encoding="utf-8")
    documents = loader.load()
    logger.info("Loaded %d document(s) from %s", len(documents), DATA_FILE)

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    chunks = splitter.split_documents(documents)
    logger.info("Created %d chunks", len(chunks))

    # 3. Embed + store in FAISS
    embeddings = JinaEmbeddings(model_name="jina-embeddings-v2-base-en")
    vector_store = FAISS.from_documents(chunks, embeddings)
    retriever = vector_store.as_retriever(search_kwargs={"k": TOP_K})
    logger.info("Vector store ready with %d vectors", vector_store.index.ntotal)

    # 4. Define the retrieval tool
    @tool
    def search_hr_policy(question: str) -> str:
        """Search the HR policy document for information about leave, work from home,
        probation, notice period, reimbursement, code of conduct, holidays, or exit process."""
        matching_chunks = retriever.invoke(question)
        return "\n\n".join(chunk.page_content for chunk in matching_chunks)

    # 5. Build the LLM
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)

    # 6. Build the agent (modern create_agent API used in notebook)
    agent = create_agent(
        model=llm,
        tools=[search_hr_policy],
        system_prompt=SYSTEM_PROMPT,
    )

    logger.info("HR assistant agent ready!")
    return agent


# ---------------------------------------------------------------------------
# Ask helper
# ---------------------------------------------------------------------------
def ask(agent, question: str) -> str:
    """Invoke the agent and return only the final text answer."""
    logger.info("Received question: %s", question)
    try:
        response = agent.invoke(
            {"messages": [{"role": "user", "content": question}]}
        )
        answer = response["messages"][-1].content
        logger.info("Answer generated successfully")
        return answer
    except Exception as exc:
        logger.error("Agent error: %s", exc, exc_info=True)
        return "I encountered an error while processing your question. Please try again."

# HR Policy RAG-Based ChatBot 🤖

An AI-powered HR policy assistant for **Acme Corp** built with **Retrieval-Augmented Generation (RAG)**. Ask any question about company policies and get instant, accurate answers grounded in the official HR policy document.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.156-green?logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-latest-orange)
![Groq](https://img.shields.io/badge/LLM-Groq-purple)
![FAISS](https://img.shields.io/badge/VectorStore-FAISS-red)

---

## ✨ Features

- 🔍 **RAG Pipeline** — Retrieves relevant HR policy chunks before answering
- 🤖 **LangChain Agent** — Uses tool-calling to search and reason over policy docs
- ⚡ **Groq LLM** — Fast inference with `openai/gpt-oss-120b`
- 🧠 **Jina Embeddings** — Semantic search over policy chunks via FAISS
- 🌐 **FastAPI Backend** — Clean REST API with `/chat` and `/health` endpoints
- 🎨 **Premium HTML/CSS/JS UI** — Dark-mode glassmorphism design, no frameworks
- 📋 **Quick-question sidebar** — One-click policy category shortcuts
- 📱 **Responsive** — Works on desktop and mobile

---

## 🖼️ UI Preview

| Feature | Detail |
|---|---|
| Theme | Deep navy dark mode with indigo/violet gradients |
| Chat bubbles | Glassmorphism cards with smooth animations |
| Sidebar | 8 quick-question shortcuts for all policy categories |
| Status pill | Live agent readiness indicator |
| Typing indicator | Animated dots while the agent thinks |

---

## 🏗️ Architecture

```
User Question
     │
     ▼
FastAPI /chat endpoint
     │
     ▼
LangChain Agent (create_agent)
     │
     ├──► search_hr_policy tool
     │         │
     │         ▼
     │    FAISS Vector Store
     │    (Jina Embeddings)
     │         │
     │         ▼
     │    Top-K policy chunks
     │
     ▼
Groq LLM (openai/gpt-oss-120b)
     │
     ▼
Final Answer → UI
```

---

## 📁 Project Structure

```
HR Policy RAG Assistant/
│
├── hr_assistant/               # Core Python package
│   ├── __init__.py
│   ├── logger.py               # Shared logger factory
│   └── pipeline.py             # RAG pipeline (load → embed → agent)
│
├── static/                     # Frontend assets
│   ├── style.css               # Premium dark-mode CSS
│   └── app.js                  # Vanilla JS (fetch, markdown, sidebar)
│
├── data/
│   └── hr_policy.txt           # Acme Corp HR policy document
│
├── index.html                  # Main HTML UI
├── server.py                   # FastAPI server
├── app.py                      # (Legacy) Streamlit UI — kept for reference
├── main.py                     # CLI demo script
├── evaluate.py                 # Evaluation script
├── rag.ipynb                   # Exploration & prototyping notebook
├── requirements.txt
└── .env                        # API keys (not committed)
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aditya-students/HR_Policy_Rag-Based-ChatBot.git
cd HR_Policy_Rag-Based-ChatBot
```

### 2. Create & Activate Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY="your_groq_api_key_here"
JINA_API_KEY="your_jina_api_key_here"
```

> Get your keys from [Groq Console](https://console.groq.com) and [Jina AI](https://jina.ai).

### 5. Run the Server

```bash
uvicorn server:app --reload --port 8000
```

Then open **http://localhost:8000** in your browser. 🎉

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| LLM | [Groq](https://groq.com) — `openai/gpt-oss-120b` |
| Embeddings | [Jina AI](https://jina.ai) — `jina-embeddings-v2-base-en` |
| Vector Store | [FAISS](https://github.com/facebookresearch/faiss) |
| Agent / RAG | [LangChain](https://langchain.com) |
| Backend | [FastAPI](https://fastapi.tiangolo.com) + [Uvicorn](https://www.uvicorn.org) |
| Frontend | Vanilla HTML, CSS, JavaScript |

---

## 📋 Policy Topics Covered

The assistant can answer questions about:

- 🏖️ **Leave Policy** — Annual, sick leave, carry-forward rules
- 🏠 **Work From Home** — WFH days per week, core hours
- 📋 **Probation Period** — Duration, leave eligibility during probation
- 📝 **Notice Period** — Standard and probation notice periods
- 💰 **Reimbursements** — How to claim, deadlines, processing time
- ⚖️ **Code of Conduct** — Workplace expectations and training
- 🎉 **Holidays** — Public holidays, compensatory leave
- 🚪 **Exit Policy** — Clearance process, full & final settlement

---

## 📡 API Reference

### `POST /chat`

Send a question to the HR assistant.

**Request:**
```json
{
  "question": "How many annual leave days do I get?"
}
```

**Response:**
```json
{
  "answer": "As per the HR policy, all full-time employees are entitled to **20 days** of paid annual leave per calendar year..."
}
```

### `GET /health`

Check if the server and agent are ready.

**Response:**
```json
{
  "status": "ok",
  "agent_ready": true
}
```

### `GET /docs`

FastAPI auto-generated interactive API documentation (Swagger UI).

---

## 🧪 Running the CLI Demo

```bash
python main.py
```

This runs a set of demo questions through the agent and prints answers to the console.

---

## 📓 Notebook

`rag.ipynb` contains the step-by-step exploration of the RAG pipeline — document loading, chunking, embedding, vector search, and agent setup. Great for understanding how everything works.

---

## 📄 License

This project is for educational purposes.

---

> Built with ❤️ using LangChain, Groq, FastAPI, and vanilla HTML/CSS/JS.

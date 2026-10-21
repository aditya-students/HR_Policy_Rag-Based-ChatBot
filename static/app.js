/* =====================================================================
   HR Policy Assistant – app.js
   ===================================================================== */

"use strict";

const API_BASE = "";          // same origin — empty = relative URLs

// ── DOM refs ──────────────────────────────────────────────────────────────
const chatWindow    = document.getElementById("chatWindow");
const questionInput = document.getElementById("questionInput");
const sendBtn       = document.getElementById("sendBtn");
const clearBtn      = document.getElementById("clearChat");
const statusPill    = document.getElementById("statusPill");
const statusDot     = document.getElementById("statusDot");
const statusText    = document.getElementById("statusText");
const sidebar       = document.getElementById("sidebar");
const hamburger     = document.getElementById("hamburger");
const sidebarClose  = document.getElementById("sidebarClose");
const overlay       = document.getElementById("overlay");
const quickBtns     = document.querySelectorAll(".quick-btn");

// ── State ─────────────────────────────────────────────────────────────────
let isLoading = false;

// ── Init ──────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  renderWelcome();
  checkHealth();
  autoResize();
});

// ── Health check ──────────────────────────────────────────────────────────
async function checkHealth() {
  setStatus("connecting");
  try {
    const res  = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.agent_ready) {
      setStatus("ready");
    } else {
      setStatus("connecting");
      setTimeout(checkHealth, 3000);   // retry until agent is ready
    }
  } catch {
    setStatus("error");
    setTimeout(checkHealth, 5000);
  }
}

function setStatus(state) {
  statusPill.className = "status-pill";
  if (state === "ready") {
    statusPill.classList.add("ready");
    statusText.textContent = "Ready";
  } else if (state === "error") {
    statusPill.classList.add("error");
    statusText.textContent = "Offline";
  } else {
    statusText.textContent = "Connecting…";
  }
}

// ── Welcome ───────────────────────────────────────────────────────────────
function renderWelcome() {
  const topics = ["Leave Policy","WFH","Probation","Notice Period","Reimbursement","Holidays","Exit Policy","Conduct"];
  chatWindow.innerHTML = `
    <div class="welcome-card">
      <div class="welcome-emoji">🤖</div>
      <h1>HR Policy Assistant</h1>
      <p>Hi! I'm your AI-powered HR guide for <strong>Acme Corp</strong>.<br>
         Ask me anything about company policies — I'll look them up instantly.</p>
      <div class="welcome-tags">
        ${topics.map(t => `<span class="welcome-tag">${t}</span>`).join("")}
      </div>
    </div>`;
}

// ── Send ──────────────────────────────────────────────────────────────────
async function sendMessage(question) {
  question = question.trim();
  if (!question || isLoading) return;

  appendMessage("user", question);
  questionInput.value = "";
  autoResize();

  const typingId = appendTyping();
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ question }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    removeTyping(typingId);
    appendMessage("assistant", data.answer);
  } catch (err) {
    removeTyping(typingId);
    appendMessage("assistant", `⚠️ **Error:** ${err.message}. Please check the server and try again.`);
  } finally {
    setLoading(false);
  }
}

function setLoading(val) {
  isLoading   = val;
  sendBtn.disabled = val;
}

// ── DOM helpers ───────────────────────────────────────────────────────────
function appendMessage(role, text) {
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;

  const avatarEmoji = role === "assistant" ? "🤖" : "👤";
  const formatted   = formatText(text);

  row.innerHTML = `
    <div class="avatar">${avatarEmoji}</div>
    <div class="bubble">${formatted}</div>`;

  chatWindow.appendChild(row);
  scrollToBottom();
  return row;
}

function appendTyping() {
  const id  = "typing-" + Date.now();
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id        = id;
  row.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble">
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  chatWindow.appendChild(row);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
}

// ── Text formatter (basic markdown-ish) ───────────────────────────────────
function formatText(text) {
  // Escape HTML
  let s = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Bullet lists (lines starting with - or *)
  s = s.replace(/^[\-\*]\s+(.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Numbered lists
  s = s.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Line breaks → paragraphs
  const paras = s.split(/\n{2,}/);
  if (paras.length > 1) {
    s = paras.map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  } else {
    s = s.replace(/\n/g, "<br>");
  }

  return s;
}

// ── Auto-resize textarea ───────────────────────────────────────────────────
function autoResize() {
  questionInput.style.height = "auto";
  questionInput.style.height = Math.min(questionInput.scrollHeight, 140) + "px";
}

// ── Events ────────────────────────────────────────────────────────────────
sendBtn.addEventListener("click", () => sendMessage(questionInput.value));

questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(questionInput.value);
  }
});

questionInput.addEventListener("input", autoResize);

clearBtn.addEventListener("click", () => {
  renderWelcome();
});

// Quick question buttons
quickBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const q = btn.dataset.q;
    questionInput.value = q;
    autoResize();
    sendMessage(q);
    // close sidebar on mobile
    closeSidebar();
  });
});

// Sidebar toggle
hamburger.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

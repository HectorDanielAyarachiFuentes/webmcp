/**
 * UI Module - Chat, Inspector, Activity Tracing & Modals
 * Coordinates user feedback, visual states, and inspector views.
 */

export function appendChatMessage(text, sender, toolName = null, aiSource = null) {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;

  let content = `<div>${escapeHtml(text)}</div>`;
  if (toolName) {
    content += `<span class="tool-invoked-tag">⚡ WebMCP: ${escapeHtml(toolName)}</span>`;
  } else if (aiSource && sender === 'agent') {
    content += `<span class="tool-invoked-tag" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.4); color: #c084fc;">🧠 ${escapeHtml(aiSource)}</span>`;
  }
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  content += `<span class="bubble-meta">${sender === 'user' ? 'Tú' : 'Asistente'} • ${time}</span>`;

  bubble.innerHTML = content;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

export function addTrace(type, msg, category = "info") {
  const traceLog = document.getElementById("traceLog");
  if (!traceLog) return;

  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const item = document.createElement("div");
  item.className = `trace-item ${category}`;
  item.innerHTML = `
    <span class="trace-time">${time}</span>
    <span class="trace-badge">${type}</span>
    <span class="trace-msg">${escapeHtml(msg)}</span>
  `;

  traceLog.appendChild(item);
  traceLog.scrollTop = traceLog.scrollHeight;
}

export function updateToolsInspector() {
  const listEl = document.getElementById("toolsList");
  const countEl = document.getElementById("toolCount");
  if (!listEl || !document.modelContext) return;

  const tools = document.modelContext.getTools();
  if (countEl) countEl.textContent = tools.length;
  listEl.innerHTML = "";

  tools.forEach(tool => {
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML = `
      <div class="tool-card-head">
        <span class="tool-name">${escapeHtml(tool.name)}</span>
        <span class="tool-scope">document.modelContext</span>
      </div>
      <p class="tool-description">${escapeHtml(tool.description)}</p>
      <pre class="tool-schema"><code>${escapeHtml(JSON.stringify(tool.inputSchema || {}, null, 2))}</code></pre>
    `;
    listEl.appendChild(card);
  });
}

export function setAgentState(text, isBusy = false) {
  const stateText = document.getElementById("agentStateText");
  if (stateText) stateText.textContent = text;
}

export function updateConversationUI(state) {
  const panel = document.querySelector(".agent-panel");
  const micLabel = document.getElementById("micButtonLabel");
  const hintEl = document.getElementById("conversationModeHint");
  const badgeEl = document.getElementById("conversationModeBadge");

  if (!panel) return;

  if (state.conversationActive) {
    panel.classList.add("conversation-live");
    if (badgeEl) badgeEl.classList.remove("paused");
  } else {
    panel.classList.remove("conversation-live");
    if (badgeEl) badgeEl.classList.add("paused");
  }

  if (state.isListening) {
    panel.classList.add("listening");
    panel.classList.remove("speaking");
    if (micLabel) micLabel.textContent = "🎙️ Te estoy escuchando...";
  } else if (state.isSpeaking) {
    panel.classList.add("speaking");
    panel.classList.remove("listening");
    if (micLabel) micLabel.textContent = "🔊 Respondiendo...";
  } else {
    panel.classList.remove("listening");
    panel.classList.remove("speaking");
    if (micLabel) {
      micLabel.textContent = state.conversationActive 
        ? "🔴 Finalizar Conversación" 
        : "🎙️ Iniciar Conversación Continua";
    }
  }

  if (hintEl) {
    if (state.conversationActive) {
      hintEl.textContent = "✨ Conversación activa: Habla cuando quieras, la IA te responde y vuelve a escucharte sola.";
    } else {
      hintEl.textContent = state.continuousMode 
        ? "✨ Modo Manos Libres Activo: Haz clic para empezar y habla naturalmente sin tocar nada más." 
        : "Modo Pulsar para Hablar: Haz clic cada vez que quieras hablar.";
    }
  }
}

export function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-body").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.dataset.tab;
      const targetBody = document.getElementById(targetId);
      if (targetBody) targetBody.classList.add("active");
    });
  });
}

export function initAiModal(aiConfig, onSaveCallback) {
  const aiConfigBtn = document.getElementById("aiConfigBtn");
  const aiConfigModal = document.getElementById("aiConfigModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveAiConfigBtn = document.getElementById("saveAiConfigBtn");
  const aiProviderSelect = document.getElementById("aiProviderSelect");
  const apiKeyField = document.getElementById("apiKeyField");
  const endpointField = document.getElementById("endpointField");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const endpointInput = document.getElementById("endpointInput");
  const aiModelBadgeLabel = document.getElementById("aiModelBadgeLabel");

  function updateProviderFieldsUI() {
    if (!aiProviderSelect || !apiKeyField || !endpointField) return;
    const prov = aiProviderSelect.value;
    if (prov === "autonomous") {
      apiKeyField.style.display = "none";
      endpointField.style.display = "none";
    } else if (prov === "gemini") {
      apiKeyField.style.display = "flex";
      endpointField.style.display = "none";
      const lbl = document.getElementById("apiKeyLabel");
      if (lbl) lbl.textContent = "Clave de Gemini API:";
      if (apiKeyInput) apiKeyInput.placeholder = "AIzaSy...";
    } else if (prov === "ollama") {
      apiKeyField.style.display = "none";
      endpointField.style.display = "flex";
    } else if (prov === "openai") {
      apiKeyField.style.display = "flex";
      endpointField.style.display = "flex";
      const lbl = document.getElementById("apiKeyLabel");
      if (lbl) lbl.textContent = "Clave de API:";
      if (apiKeyInput) apiKeyInput.placeholder = "sk-...";
    }
  }

  function updateBadgeLabel() {
    if (!aiModelBadgeLabel) return;
    if (aiConfig.provider === "gemini") {
      aiModelBadgeLabel.textContent = "Cerebro: Gemini AI";
    } else if (aiConfig.provider === "ollama") {
      aiModelBadgeLabel.textContent = "Cerebro: Ollama Local";
    } else if (aiConfig.provider === "openai") {
      aiModelBadgeLabel.textContent = "Cerebro: OpenAI";
    } else {
      aiModelBadgeLabel.textContent = "Cerebro: Híbrido Libre";
    }
  }

  if (aiProviderSelect) {
    aiProviderSelect.value = aiConfig.provider;
    if (apiKeyInput) apiKeyInput.value = aiConfig.apiKey;
    if (endpointInput) endpointInput.value = aiConfig.endpoint;
    updateProviderFieldsUI();
    updateBadgeLabel();

    aiProviderSelect.addEventListener("change", updateProviderFieldsUI);
  }

  if (aiConfigBtn && aiConfigModal) {
    aiConfigBtn.addEventListener("click", () => {
      aiConfigModal.style.display = "flex";
    });
  }

  if (closeModalBtn && aiConfigModal) {
    closeModalBtn.addEventListener("click", () => {
      aiConfigModal.style.display = "none";
    });
    aiConfigModal.addEventListener("click", (e) => {
      if (e.target === aiConfigModal) aiConfigModal.style.display = "none";
    });
  }

  if (saveAiConfigBtn && aiConfigModal) {
    saveAiConfigBtn.addEventListener("click", () => {
      aiConfig.provider = aiProviderSelect.value;
      aiConfig.apiKey = apiKeyInput.value.trim();
      aiConfig.endpoint = endpointInput.value.trim();

      updateBadgeLabel();
      aiConfigModal.style.display = "none";
      if (onSaveCallback) onSaveCallback(aiConfig);
    });
  }
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

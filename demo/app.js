/**
 * WebMCP Voice Studio - Modular Entry Point
 * 
 * Complies with the W3C Web Model Context Protocol specification draft.
 * Integrates WebMCP tools, full-duplex hands-free conversational voice,
 * and universal open intelligence.
 */

import { setupWebMCPPolyfill, registerDefaultTools } from "./js/webmcp-core.js";
import { askUniversalIntelligence, loadAiConfig, saveAiConfig } from "./js/ai-brain.js";
import {
  initSpeechSynthesis,
  playTurnChime,
  playBeep,
  speakResponse,
  initSpeechRecognition,
  startListening,
  stopListening,
  startConversation,
  pauseConversation,
  toggleConversation,
  initAudioVisualizer
} from "./js/voice-engine.js";
import {
  renderTaskList,
  loadSavedTasks,
  renderChart,
  startTimer,
  stopTimer,
  resetTimer
} from "./js/widgets.js";
import {
  appendChatMessage,
  addTrace,
  updateToolsInspector,
  setAgentState,
  updateConversationUI,
  initTabs,
  initAiModal
} from "./js/ui.js";

// ============================================================================
// 1. Central Application State
// ============================================================================
export const state = {
  isListening: false,
  isSpeaking: false,
  continuousMode: true,
  conversationActive: false,
  ttsEnabled: true,
  relistenTimeout: null,
  availableVoices: [],
  tasks: loadSavedTasks(),
  timer: {
    intervalId: null,
    remainingSeconds: 0,
    isRunning: false
  },
  chart: {
    type: "barras",
    title: "Métricas en Tiempo Real",
    values: [45, 78, 62, 90, 54, 85],
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  },
  aiConfig: loadAiConfig()
};

// ============================================================================
// 2. Central Callbacks Bundle
// ============================================================================
export const callbacks = {
  updateConversationUI: () => updateConversationUI(state),
  setAgentState: (text, isBusy) => setAgentState(text, isBusy),
  addTrace: (type, msg, cat) => addTrace(type, msg, cat),
  onUserInstruction: (text) => processUserInstruction(text),
  appendChatMessage: (text, sender, toolName, aiSource) => appendChatMessage(text, sender, toolName, aiSource),
  speakResponse: (text) => speakResponse(text, state, callbacks),
  playBeep: () => playBeep()
};

// ============================================================================
// 3. Instruction Processor & NLU Dispatcher
// ============================================================================
export async function processUserInstruction(rawText) {
  if (!rawText || !rawText.trim()) return;

  const text = rawText.trim();
  appendChatMessage(text, "user");
  addTrace("VOICE_INPUT", `Instrucción recibida: "${text}"`, "voice");
  setAgentState("Analizando instrucción...", true);

  // Small delay for natural agent rhythm
  await new Promise(r => setTimeout(r, 260));

  const lower = text.toLowerCase();
  let toolToCall = null;
  let toolArgs = {};
  let directSpeechResponse = null;

  // 1. Check for Theme Change (Explicit intent)
  if (/\b(cambia(r)?|pon(er)?|modifica(r)?|aplica(r)?)\s+(el\s+)?(tema|color|estilo)\b/i.test(lower) || /\b(tema|modo)\s+(cyberpunk|esmeralda|sunset|midnight|oscuro|ne[oó]n|matrix)\b/i.test(lower)) {
    toolToCall = "cambiar_tema";
    if (lower.includes("cyber") || lower.includes("neón") || lower.includes("neon") || lower.includes("futurista")) {
      toolArgs = { tema: "cyberpunk" };
    } else if (lower.includes("esmeralda") || lower.includes("verde") || lower.includes("matrix")) {
      toolArgs = { tema: "emerald" };
    } else if (lower.includes("sunset") || lower.includes("atardecer") || lower.includes("rosa") || lower.includes("violeta")) {
      toolArgs = { tema: "sunset" };
    } else {
      toolArgs = { tema: "midnight" };
    }
  }
  // 2. Check for Task Management (Explicit intent)
  else if (/\b(agrega|crea|a[ñn]ade|pon|nueva)\s+(una\s+)?(tarea|nota|recordatorio)\b/i.test(lower) || /\b(completa|marcar|termina|tacha)\s+(la\s+)?tarea\b/i.test(lower) || /\b(limpia|borra|elimina)\s+(todas\s+las\s+)?tareas\b/i.test(lower)) {
    toolToCall = "gestionar_tareas";
    if (lower.includes("complet") || lower.includes("marcar") || lower.includes("termina")) {
      toolArgs = { accion: "completar" };
    } else if (lower.includes("limpia") || lower.includes("borra") || lower.includes("elimina")) {
      toolArgs = { accion: "limpiar" };
    } else {
      let cleaned = text.replace(/^(agrega|crea|añade|nueva|pon)\s+(una\s+)?(tarea|nota)(\s*:)?\s*/i, "");
      if (!cleaned || cleaned === text) {
        cleaned = text.replace(/tarea/i, "").trim();
      }
      toolArgs = { accion: "agregar", texto: cleaned || "Nueva tarea desde comando de voz" };
    }
  }
  // 3. Check for Timer (Explicit intent)
  else if (/\b(inicia|pon|activa|configura|cuenta\s+regresiva)\s+(un\s+)?temporizador\b/i.test(lower) || /\b(temporizador|alarma)\s+(de\s+)?\d+\s*(segundos|minuto)/i.test(lower) || /\b(det[eé]n|para|cancela|reinicia)\s+(el\s+)?temporizador\b/i.test(lower)) {
    toolToCall = "controlar_temporizador";
    if (lower.includes("detén") || lower.includes("para") || lower.includes("stop") || lower.includes("pausa") || lower.includes("cancela")) {
      toolArgs = { accion: "detener" };
    } else if (lower.includes("reinicia") || lower.includes("reset")) {
      toolArgs = { accion: "reiniciar" };
    } else {
      const match = text.match(/\d+/);
      let sec = 25;
      if (match) {
        let num = parseInt(match[0], 10);
        if (lower.includes("minuto")) num = num * 60;
        sec = num;
      }
      toolArgs = { accion: "iniciar", segundos: sec };
    }
  }
  // 4. Check for Chart Generation (Explicit intent)
  else if (/\b(genera|crea|muestra|haz|dibuja|actualiza)\s+(un\s+)?gr[aá]fico\b/i.test(lower) || /\b(gr[aá]fico\s+de\s+(barras|l[ií]neas|ventas|m[eé]tricas))\b/i.test(lower)) {
    toolToCall = "generar_grafico";
    const isLines = lower.includes("línea") || lower.includes("lineas");
    toolArgs = {
      titulo: lower.includes("ventas") ? "Ventas Trimestrales" : "Métricas de Actividad",
      tipo: isLines ? "lineas" : "barras"
    };
  }
  // 5. Check for Screen Reading
  else if (/\b(lee|resume|qu[eé] hay en)\s+(la\s+)?pantalla\b/i.test(lower)) {
    toolToCall = "leer_contenido_pantalla";
    toolArgs = { seccion: lower.includes("tarea") ? "tareas" : lower.includes("grafico") ? "grafico" : "general" };
  }
  // 6. Check for Tools Query
  else if (/\b(qu[eé] herramientas|lista de herramientas|qu[eé] puedes controlar|comandos disponibles)\b/i.test(lower)) {
    toolToCall = "consultar_herramientas";
    toolArgs = {};
  }
  // 7. Conversational Flow Session Controls (Pause/Resume Listening)
  else if (/\b(pausa la conversaci[oó]n|para de escuchar|silencio por favor|pausa el micr[oó]fono)\b/i.test(lower)) {
    pauseConversation(state, callbacks);
    directSpeechResponse = "Conversación pausada. Haz clic en el botón o presiona la barra espaciadora cuando quieras que vuelva a escucharte.";
  } else if (/\b(contin[uú]a escuchando|reanuda la conversaci[oó]n|sigue escuchando)\b/i.test(lower)) {
    startConversation(state, callbacks);
    directSpeechResponse = "Conversación reanudada. Te escucho.";
  }

  // Execute WebMCP tool if matched
  if (toolToCall) {
    const tool = document.modelContext.tools.get(toolToCall);
    if (tool) {
      addTrace("TOOL_INVOKE", `Llamando herramienta: ${toolToCall}(${JSON.stringify(toolArgs)})`, "tool");
      setAgentState(`Ejecutando ${toolToCall}...`, true);

      try {
        const result = await tool.execute(toolArgs);
        addTrace("TOOL_RESULT", `Resultado: ${JSON.stringify(result)}`, "tool");

        let verbalResponse = result.message || "Acción completada con éxito.";
        if (toolToCall === "consultar_herramientas") {
          verbalResponse = `Tengo disponibles ${result.total} herramientas: cambiar tema, gestionar tareas, controlar temporizador, generar gráficos, leer pantalla y consultar herramientas.`;
        }

        appendChatMessage(verbalResponse, "agent", toolToCall);
        speakResponse(verbalResponse, state, callbacks);
      } catch (err) {
        const errMsg = `Error al ejecutar la herramienta: ${err.message}`;
        appendChatMessage(errMsg, "agent");
        speakResponse(errMsg, state, callbacks);
      }
    }
  } else {
    // Open conversational or knowledge query
    let answer = directSpeechResponse;
    let sourceLabel = null;

    if (!answer) {
      setAgentState("Consultando cerebro de IA...", true);
      addTrace("AI_QUERY", `Consultando conocimiento para: "${text}"`, "voice");
      const res = await askUniversalIntelligence(text, state.aiConfig);
      answer = res.text;
      sourceLabel = res.source;
    }

    appendChatMessage(answer, "agent", null, sourceLabel);
    speakResponse(answer, state, callbacks);
  }

  setAgentState("Listo para escucharte", false);
}

// ============================================================================
// 4. Application Initialization
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  // Setup WebMCP Core Polyfill
  setupWebMCPPolyfill();

  // Register default WebMCP demo tools
  await registerDefaultTools({
    state,
    renderTaskList: () => renderTaskList(state),
    renderChart: () => renderChart(state),
    startTimer: (sec) => startTimer(sec, state, {
      appendChatMessage,
      speakResponse: (msg) => speakResponse(msg, state, callbacks),
      playBeep
    }),
    stopTimer: () => stopTimer(state),
    resetTimer: () => resetTimer(state)
  });

  // Restore saved theme
  const savedTheme = localStorage.getItem("webmcp_theme") || "theme-midnight";
  document.body.className = savedTheme;
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) themeSelect.value = savedTheme;

  // Initialize Audio & Speech Systems
  initSpeechSynthesis(state);
  initSpeechRecognition(state, callbacks);
  initAudioVisualizer(state);
  initTabs();

  // Render initial widgets
  renderTaskList(state);
  renderChart(state);
  updateToolsInspector();
  addTrace("INIT", "WebMCP Studio iniciado con 6 herramientas registradas", "init");

  // Welcome greeting
  setTimeout(() => {
    appendChatMessage("¡Hola! Soy tu asistente de voz WebMCP modular. Presiona 'Iniciar Conversación' o la barra espaciadora y podremos hablar con total naturalidad sin pulsar botones.", "agent");
  }, 400);

  // Big Mic / Conversation Button
  const micBtn = document.getElementById("micButton");
  if (micBtn) {
    micBtn.addEventListener("click", (e) => {
      e.currentTarget.blur();
      if (state.continuousMode) {
        toggleConversation(state, callbacks);
      } else {
        if (state.isListening) {
          stopListening(state, callbacks);
        } else {
          startListening(state, callbacks);
        }
      }
    });
  }

  // Continuous Mode Switch
  const continuousToggle = document.getElementById("continuousModeToggle");
  if (continuousToggle) {
    continuousToggle.addEventListener("change", (e) => {
      state.continuousMode = e.target.checked;
      if (!state.continuousMode && state.conversationActive) {
        pauseConversation(state, callbacks);
      }
      updateConversationUI(state);
    });
  }

  // Keyboard shortcut: Spacebar to toggle conversation
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      if (e.repeat) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") {
        return;
      }
      e.preventDefault();
      if (state.continuousMode) {
        toggleConversation(state, callbacks);
      } else {
        if (state.isListening) {
          stopListening(state, callbacks);
        } else {
          startListening(state, callbacks);
        }
      }
    }
  });

  // Text Command Form
  const form = document.getElementById("textCommandForm");
  const input = document.getElementById("textCommandInput");
  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (val) {
        processUserInstruction(val);
        input.value = "";
      }
    });
  }

  // Suggested Chip Buttons
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const cmd = chip.dataset.cmd;
      if (cmd) processUserInstruction(cmd);
    });
  });

  // Manual Task input inline
  const manualTaskInput = document.getElementById("manualTaskInput");
  const manualTaskAddBtn = document.getElementById("manualTaskAddBtn");
  if (manualTaskAddBtn && manualTaskInput) {
    manualTaskAddBtn.addEventListener("click", () => {
      const txt = manualTaskInput.value.trim();
      if (txt) {
        state.tasks.push({ id: Date.now(), text: txt, completed: false });
        renderTaskList(state);
        manualTaskInput.value = "";
      }
    });
    manualTaskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") manualTaskAddBtn.click();
    });
  }

  // Timer controls
  const timerStopBtn = document.getElementById("timerStopBtn");
  const timerResetBtn = document.getElementById("timerResetBtn");
  if (timerStopBtn) timerStopBtn.addEventListener("click", () => stopTimer(state));
  if (timerResetBtn) timerResetBtn.addEventListener("click", () => resetTimer(state));

  // TTS Mute Button
  const ttsBtn = document.getElementById("ttsMuteBtn");
  if (ttsBtn) {
    ttsBtn.addEventListener("click", () => {
      state.ttsEnabled = !state.ttsEnabled;
      if (!state.ttsEnabled) {
        window.speechSynthesis.cancel();
        ttsBtn.classList.add("muted");
        ttsBtn.title = "Voz silenciada. Clic para reactivar";
      } else {
        ttsBtn.classList.remove("muted");
        ttsBtn.title = "Silenciar / Activar voz de respuesta";
      }
    });
  }

  // Clear Chat Button
  const clearChatBtn = document.getElementById("clearChatBtn");
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) chatMessages.innerHTML = "";
    });
  }

  // Theme Dropdown Change
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      document.body.className = e.target.value;
      localStorage.setItem("webmcp_theme", e.target.value);
      renderChart(state);
    });
  }

  // AI Brain Config Modal Wiring
  initAiModal(state.aiConfig, (updatedConfig) => {
    saveAiConfig(updatedConfig);
    addTrace("AI_CONFIG", `Cerebro configurado: ${updatedConfig.provider}`, "init");
    appendChatMessage(`Configuración guardada. Ahora el asistente responderá con el proveedor: ${updatedConfig.provider.toUpperCase()}.`, "agent", null, "Configuración");
  });
});

/**
 * WebMCP Voice Studio - In-browser Agent & WebMCP Implementation
 * Compliant with W3C WebMCP specification draft.
 */

// ============================================================================
// 1. WebMCP Standard Polyfill & Environment Setup
// ============================================================================
if (!document.modelContext) {
  document.modelContext = {
    tools: new Map(),
    async registerTool(toolDef) {
      if (!toolDef || !toolDef.name) {
        throw new Error("Invalid tool definition: 'name' is required.");
      }
      this.tools.set(toolDef.name, toolDef);
      window.dispatchEvent(new CustomEvent('webmcp:tool-registered', { detail: toolDef }));
      return toolDef;
    },
    unregisterTool(name) {
      this.tools.delete(name);
      window.dispatchEvent(new CustomEvent('webmcp:tool-unregistered', { detail: { name } }));
    },
    getTools() {
      return Array.from(this.tools.values());
    }
  };
}

// Polyfill navigator.modelContext as alias
if (!navigator.modelContext) {
  navigator.modelContext = document.modelContext;
}

// ============================================================================
// 2. Application State
// ============================================================================
const state = {
  isListening: false,
  isSpeaking: false,
  ttsEnabled: true,
  continuousMode: true,        // Conversación continua manos libres activa por defecto
  conversationActive: false,   // True cuando el usuario inicia la sesión de conversación
  relistenTimeout: null,
  tasks: [
    { id: 1, text: "Explorar la especificación WebMCP de la W3C", completed: true },
    { id: 2, text: "Hablarle al asistente para probar comandos de voz", completed: false }
  ],
  timer: {
    intervalId: null,
    remainingSeconds: 0,
    isRunning: false
  },
  chart: {
    title: "Ventas Trimestrales (Q1 - Q4)",
    type: "barras",
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
    values: [45, 68, 52, 91, 74, 110]
  },
  availableVoices: []
};

const aiConfig = {
  provider: localStorage.getItem("webmcp_ai_provider") || "autonomous",
  apiKey: localStorage.getItem("webmcp_ai_key") || "",
  endpoint: localStorage.getItem("webmcp_ai_endpoint") || "http://localhost:11434"
};

// ============================================================================
// 3. Register WebMCP Tools (document.modelContext.registerTool)
// ============================================================================
async function initWebMCPTools() {
  // Tool 1: Cambiar Tema Visual
  await document.modelContext.registerTool({
    name: "cambiar_tema",
    description: "Modifica el tema de color y estilo visual de la interfaz gráfica.",
    inputSchema: {
      type: "object",
      properties: {
        tema: {
          type: "string",
          enum: ["midnight", "cyberpunk", "emerald", "sunset"],
          description: "Nombre del tema visual solicitado."
        }
      },
      required: ["tema"]
    },
    execute({ tema }) {
      const normalized = tema.toLowerCase();
      let selectedTheme = "theme-midnight";
      let displayName = "Medianoche";

      if (normalized.includes("cyber") || normalized.includes("neon") || normalized.includes("neón")) {
        selectedTheme = "theme-cyberpunk";
        displayName = "Cyberpunk Neón";
      } else if (normalized.includes("esmeralda") || normalized.includes("matrix") || normalized.includes("verde")) {
        selectedTheme = "theme-emerald";
        displayName = "Esmeralda Matrix";
      } else if (normalized.includes("sunset") || normalized.includes("atardecer") || normalized.includes("violeta") || normalized.includes("rosa")) {
        selectedTheme = "theme-sunset";
        displayName = "Atardecer Violeta";
      }

      document.body.className = selectedTheme;
      const themeSelect = document.getElementById("themeSelect");
      if (themeSelect) themeSelect.value = selectedTheme;

      renderChart(); // Redraw chart with new theme colors
      return {
        status: "success",
        temaAplicado: displayName,
        message: `Tema cambiado a ${displayName}.`
      };
    }
  });

  // Tool 2: Gestionar Tareas
  await document.modelContext.registerTool({
    name: "gestionar_tareas",
    description: "Añade, completa, elimina o lista tareas en la aplicación.",
    inputSchema: {
      type: "object",
      properties: {
        accion: {
          type: "string",
          enum: ["agregar", "completar", "eliminar", "limpiar", "listar"],
          description: "Operación a realizar sobre la lista de tareas."
        },
        texto: { type: "string", description: "Descripción de la tarea a agregar." },
        id: { type: "number", description: "ID de la tarea a completar o eliminar." }
      },
      required: ["accion"]
    },
    execute({ accion, texto, id }) {
      switch (accion) {
        case "agregar":
          if (!texto) return { status: "error", message: "Falta el texto de la tarea." };
          const newTask = {
            id: Date.now(),
            text: texto.trim(),
            completed: false
          };
          state.tasks.push(newTask);
          renderTaskList();
          return {
            status: "success",
            message: `Tarea agregada: "${newTask.text}"`,
            totalTareas: state.tasks.length
          };

        case "completar":
          let target = state.tasks.find(t => t.id === Number(id));
          if (!target && state.tasks.length > 0) {
            // Fallback to first uncompleted task
            target = state.tasks.find(t => !t.completed) || state.tasks[0];
          }
          if (target) {
            target.completed = true;
            renderTaskList();
            return { status: "success", message: `Tarea "${target.text}" marcada como completada.` };
          }
          return { status: "not_found", message: "No se encontró la tarea especificada." };

        case "limpiar":
          state.tasks = [];
          renderTaskList();
          return { status: "success", message: "Se eliminaron todas las tareas." };

        default:
          return { status: "success", totalTareas: state.tasks.length, tareas: state.tasks };
      }
    }
  });

  // Tool 3: Controlar Temporizador
  await document.modelContext.registerTool({
    name: "controlar_temporizador",
    description: "Inicia, detiene o reinicia un temporizador inteligente en pantalla.",
    inputSchema: {
      type: "object",
      properties: {
        accion: { type: "string", enum: ["iniciar", "detener", "reiniciar"] },
        segundos: { type: "number", description: "Segundos de duración para la cuenta regresiva." }
      },
      required: ["accion"]
    },
    execute({ accion, segundos }) {
      if (accion === "iniciar") {
        const sec = Number(segundos) || 30;
        startTimer(sec);
        return { status: "success", message: `Temporizador iniciado por ${sec} segundos.` };
      } else if (accion === "detener") {
        stopTimer();
        return { status: "success", message: "Temporizador detenido." };
      } else if (accion === "reiniciar") {
        resetTimer();
        return { status: "success", message: "Temporizador reiniciado." };
      }
    }
  });

  // Tool 4: Generar Gráfico Dinámico
  await document.modelContext.registerTool({
    name: "generar_grafico",
    description: "Crea o actualiza gráficos de barras o líneas con datos numéricos en pantalla.",
    inputSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Título del gráfico a presentar." },
        tipo: { type: "string", enum: ["barras", "lineas"] },
        valores: { type: "array", items: { type: "number" } }
      }
    },
    execute({ titulo, tipo, valores }) {
      if (titulo) state.chart.title = titulo;
      if (tipo) state.chart.type = tipo;
      if (valores && Array.isArray(valores) && valores.length > 0) {
        state.chart.values = valores;
      } else {
        // Generate random realistic trend
        state.chart.values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 80) + 30);
      }
      renderChart();
      return {
        status: "success",
        message: `Gráfico "${state.chart.title}" actualizado con ${state.chart.values.length} puntos de datos.`
      };
    }
  });

  // Tool 5: Consultar Herramientas Registradas
  await document.modelContext.registerTool({
    name: "consultar_herramientas",
    description: "Devuelve la lista de capacidades y herramientas WebMCP disponibles en la página.",
    inputSchema: { type: "object", properties: {} },
    execute() {
      const tools = document.modelContext.getTools().map(t => ({
        name: t.name,
        description: t.description
      }));
      return {
        status: "success",
        total: tools.length,
        herramientas: tools
      };
    }
  });

  updateToolsInspector();
  addTrace("INIT", "5 herramientas registradas en document.modelContext", "init");
}

// ============================================================================
// 4. Universal AI Intelligence & Knowledge Engine
// ============================================================================
const SPECIALIZED_KNOWLEDGE = [
  {
    keywords: ["que es mcp", "qué es mcp", "que es un mcp", "qué es un mcp", "model context protocol", "significa mcp", "protocolo mcp"],
    answer: "MCP significa Model Context Protocol. Es un estándar abierto desarrollado por Anthropic para permitir que los modelos de IA se conecten de forma segura y estructurada a fuentes de datos, servidores de archivos y herramientas externas mediante una arquitectura cliente-servidor."
  },
  {
    keywords: ["diferencia entre mcp y webmcp", "mcp vs webmcp", "diferencia mcp webmcp", "diferencia entre webmcp y mcp"],
    answer: "La diferencia es que MCP tradicional conecta la IA con servidores remotos y APIs en la nube, mientras que WebMCP conecta el agente de IA directamente con la pestaña del navegador y la interfaz visual del usuario mediante JavaScript en el cliente."
  },
  {
    keywords: ["que es webmcp", "qué es webmcp", "para que sirve webmcp", "que es este repositorio"],
    answer: "WebMCP es una propuesta de estándar de la W3C que permite a los sitios web registrar herramientas de JavaScript directamente en el navegador, para que agentes de IA como Gemini o ChatGPT interactúen de forma precisa sin depender de capturas de pantalla ni clics simulados."
  },
  {
    keywords: ["quien creo mcp", "quién creó mcp", "anthropic mcp"],
    answer: "El Model Context Protocol (MCP) fue desarrollado y publicado como código abierto por la empresa Anthropic a finales de 2024."
  },
  {
    keywords: ["que es un agente", "qué es un agente", "agente de ia", "agent"],
    answer: "Un agente de IA es un sistema que combina un modelo de lenguaje con herramientas, memoria y capacidad de razonamiento para percibir su entorno y ejecutar acciones autónomas para cumplir los objetivos del usuario."
  },
  {
    keywords: ["que es un llm", "qué es un llm", "large language model", "modelo de lenguaje"],
    answer: "Un LLM o modelo de lenguaje grande es una red neuronal avanzada entrenada con miles de millones de textos, capaz de entender, razonar y responder en lenguaje natural."
  },
  {
    keywords: ["que es w3c", "qué es w3c", "world wide web consortium"],
    answer: "El W3C es el consorcio internacional que define los estándares oficiales de la web, como HTML, CSS, DOM y nuevas especificaciones de inteligencia artificial como WebMCP."
  },
  {
    keywords: ["chiste", "cuentame un chiste", "dime un chiste"],
    answer: "Había una vez un programador que fue a la playa... y al ver una ola gigante, ¡intentó hacerle un 'catch' para que no se rompiera el servidor!"
  }
];

async function askUniversalIntelligence(query) {
  const norm = query.toLowerCase().replace(/[¿?¡!]/g, "").trim();

  // 1. External LLM Provider (if configured by user)
  if (aiConfig.provider === "gemini" && aiConfig.apiKey) {
    try {
      const llmAns = await queryGeminiAPI(aiConfig.apiKey, query);
      if (llmAns) return { text: llmAns, source: "Gemini AI" };
    } catch (err) {
      console.warn("Gemini query error:", err);
    }
  } else if (aiConfig.provider === "ollama") {
    try {
      const ollamaAns = await queryOllamaAPI(aiConfig.endpoint, query);
      if (ollamaAns) return { text: ollamaAns, source: "Ollama Local" };
    } catch (err) {
      console.warn("Ollama query error:", err);
    }
  } else if (aiConfig.provider === "openai" && aiConfig.apiKey) {
    try {
      const openAiAns = await queryOpenAIAPI(aiConfig.apiKey, aiConfig.endpoint, query);
      if (openAiAns) return { text: openAiAns, source: "OpenAI" };
    } catch (err) {
      console.warn("OpenAI query error:", err);
    }
  }

  // 2. Specialized Knowledge Map
  for (const item of SPECIALIZED_KNOWLEDGE) {
    if (item.keywords.some(kw => norm.includes(kw))) {
      return { text: item.answer, source: "Base WebMCP" };
    }
  }

  // 3. Live Encyclopedic Search (Wikipedia API)
  const wikiAnswer = await fetchLiveWikipediaKnowledge(query);
  if (wikiAnswer) {
    return { text: wikiAnswer, source: "Wikipedia en Vivo" };
  }

  // 4. Conversational Fallback
  return {
    text: `Entendí tu pregunta: "${query}". Aunque no tengo un dato exacto en mi enciclopedia inmediata, puedes preguntarme sobre temas de IA, tecnología, ciencia, o pedirme que interactúe con los controles de la página.`,
    source: "Asistente"
  };
}

async function fetchLiveWikipediaKnowledge(query) {
  try {
    let cleanQ = query
      .replace(/^(qué es|que es|quién fue|quien fue|quién es|quien es|cuéntame sobre|cuentame sobre|explícame|explicame|dime sobre|defina|definición de|un|una|el|la)\s+/i, '')
      .replace(/[?¿!¡]/g, '')
      .trim();

    if (cleanQ.toLowerCase() === 'mcp' || cleanQ.toLowerCase().includes('mcp')) {
      cleanQ = 'Model Context Protocol';
    } else if (cleanQ.toLowerCase() === 'w3c') {
      cleanQ = 'World Wide Web Consortium';
    }

    const sRes = await fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&origin=*`);
    const sData = await sRes.json();

    if (sData.query && sData.query.search && sData.query.search.length > 0) {
      const title = sData.query.search[0].title;
      const pRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const pData = await pRes.json();

      if (pData.extract) {
        let cleanExtract = pData.extract.replace(/\s*\([^)]*\)/g, "");
        const sentences = cleanExtract.split(/(?<=[.!?])\s+/);
        return sentences.slice(0, 2).join(' ');
      }
    }
  } catch (err) {
    console.warn("Error fetching Wikipedia knowledge:", err);
  }
  return null;
}

async function queryGeminiAPI(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "Eres un asistente de voz inteligente conectado a la web con WebMCP. Responde en español de forma directa, conversacional y en máximo 2 oraciones para ser leídas por voz." }]
      }
    })
  });
  const data = await response.json();
  if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  return null;
}

async function queryOllamaAPI(endpoint, prompt) {
  const cleanEndpoint = (endpoint || "http://localhost:11434").replace(/\/$/, "");
  const response = await fetch(`${cleanEndpoint}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: `Responde en español de forma concisa en máximo 2 oraciones para ser leídas por voz: ${prompt}`,
      stream: false
    })
  });
  const data = await response.json();
  return data.response ? data.response.trim() : null;
}

async function queryOpenAIAPI(apiKey, endpoint, prompt) {
  const cleanEndpoint = (endpoint || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${cleanEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Responde en español de forma directa y concisa en máximo 2 oraciones para voz." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await response.json();
  if (data.choices && data.choices[0].message) {
    return data.choices[0].message.content.trim();
  }
  return null;
}

// ============================================================================
// 4. Voice Agent Engine: Natural Language Understanding (NLU) & Dispatcher
// ============================================================================
async function processUserInstruction(rawText) {
  if (!rawText || !rawText.trim()) return;

  const text = rawText.trim();
  appendChatMessage(text, "user");
  addTrace("VOICE_INPUT", `Instrucción recibida: "${text}"`, "voice");
  setAgentState("Analizando instrucción...", true);

  // Small delay to simulate realistic agent reasoning
  await new Promise(r => setTimeout(r, 260));

  const lower = text.toLowerCase();
  let toolToCall = null;
  let toolArgs = {};
  let directSpeechResponse = null;

  // 1. Check for Theme Change
  if (lower.includes("tema") || lower.includes("color") || lower.includes("estilo") || lower.includes("modo")) {
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
  // 2. Check for Task Management
  else if (lower.includes("tarea") || lower.includes("nota") || lower.includes("pendiente") || lower.includes("recordatorio")) {
    toolToCall = "gestionar_tareas";
    if (lower.includes("complet") || lower.includes("marcar") || lower.includes("lista")) {
      toolArgs = { accion: "completar" };
    } else if (lower.includes("limpia") || lower.includes("borra todo") || lower.includes("elimina todo")) {
      toolArgs = { accion: "limpiar" };
    } else {
      // Extract task text
      let cleaned = text.replace(/^(agrega|crea|añade|nueva|pon)\s+(una\s+)?(tarea|nota)(\s*:)?\s*/i, "");
      if (!cleaned || cleaned === text) {
        cleaned = text.replace(/tarea/i, "").trim();
      }
      toolArgs = { accion: "agregar", texto: cleaned || "Nueva tarea desde comando de voz" };
    }
  }
  // 3. Check for Timer
  else if (lower.includes("temporizador") || lower.includes("alarma") || lower.includes("cuenta regresiva") || lower.includes("segundos") || lower.includes("minuto")) {
    toolToCall = "controlar_temporizador";
    if (lower.includes("detén") || lower.includes("para") || lower.includes("stop") || lower.includes("pausa")) {
      toolArgs = { accion: "detener" };
    } else if (lower.includes("reinicia") || lower.includes("reset")) {
      toolArgs = { accion: "reiniciar" };
    } else {
      // Find numbers in text
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
  // 4. Check for Chart Generation
  else if (lower.includes("gráfico") || lower.includes("grafica") || lower.includes("grafico") || lower.includes("estadística") || lower.includes("ventas") || lower.includes("datos")) {
    toolToCall = "generar_grafico";
    const isLines = lower.includes("línea") || lower.includes("lineas");
    toolArgs = {
      titulo: lower.includes("ventas") ? "Ventas Trimestrales" : "Métricas de Actividad",
      tipo: isLines ? "lineas" : "barras"
    };
  }
  // 5. Check for Tools Query
  else if (lower.includes("herramienta") || lower.includes("qué puedes hacer") || lower.includes("que puedes hacer") || lower.includes("capacidades") || lower.includes("comandos")) {
    toolToCall = "consultar_herramientas";
    toolArgs = {};
  }
  // 6. Conversational Flow Controls & Greetings
  else if (lower.includes("pausa") || lower.includes("detén la conversación") || lower.includes("deten la conversacion") || lower.includes("para de escuchar") || lower.includes("silencio")) {
    pauseConversation();
    directSpeechResponse = "Conversación continua pausada. Presiona el botón o la barra espaciadora cuando desees volver a hablar.";
  } else if (lower.includes("continúa") || lower.includes("continua") || lower.includes("reanuda") || lower.includes("sigue")) {
    startConversation();
    directSpeechResponse = "Conversación continua reanudada. Puedes seguir hablándome.";
  } else if (lower.includes("hola") || lower.includes("buenos días") || lower.includes("buenas tardes")) {
    directSpeechResponse = "¡Hola! Te escucho perfectamente y estamos en modo conversación continua. Dime qué deseas saber o qué herramienta quieres probar.";
  } else if (lower.includes("cómo estás") || lower.includes("como estas")) {
    directSpeechResponse = "¡Muy bien! Listo para responder cualquier pregunta o interactuar con la página web mediante WebMCP. ¿Qué quieres saber?";
  } else if (lower.includes("gracias") || lower.includes("muchas gracias")) {
    directSpeechResponse = "¡Con mucho gusto! Sigo escuchándote por si tienes otra consulta.";
  }

  // Execute tool if detected
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
          verbalResponse = `Tengo disponibles ${result.total} herramientas: cambiar tema, gestionar tareas, controlar temporizador, generar gráficos y consultar herramientas.`;
        }

        appendChatMessage(verbalResponse, "agent", toolToCall);
        speakResponse(verbalResponse);
      } catch (err) {
        const errMsg = `Error al ejecutar la herramienta: ${err.message}`;
        appendChatMessage(errMsg, "agent");
        speakResponse(errMsg);
      }
    }
  } else {
    // Open conversational or knowledge query
    let answer = directSpeechResponse;
    let sourceLabel = null;

    if (!answer) {
      setAgentState("Consultando cerebro de IA...", true);
      addTrace("AI_QUERY", `Consultando conocimiento para: "${text}"`, "voice");
      const res = await askUniversalIntelligence(text);
      answer = res.text;
      sourceLabel = res.source;
    }

    appendChatMessage(answer, "agent", null, sourceLabel);
    speakResponse(answer);
  }

  setAgentState("Listo para escucharte", false);
}

// ============================================================================
// 5. Speech Synthesis (El navegador responde hablando)
// ============================================================================
function initSpeechSynthesis() {
  if (!('speechSynthesis' in window)) return;

  function loadVoices() {
    state.availableVoices = window.speechSynthesis.getVoices();
  }

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function playTurnChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Soft two-tone chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {}
}

function speakResponse(text) {
  if (!state.ttsEnabled || !('speechSynthesis' in window)) {
    // If TTS is disabled, immediately trigger auto-listen in continuous mode
    if (state.continuousMode && state.conversationActive) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (!state.isSpeaking && state.continuousMode && state.conversationActive) {
          playTurnChime();
          startListening();
        }
      }, 600);
    }
    return;
  }

  window.speechSynthesis.cancel(); // Cancel any ongoing speech
  stopListening(); // Make sure mic is quiet while speaking so it doesn't transcribe itself

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  // Prefer natural Spanish voices
  const esVoice = state.availableVoices.find(v => v.lang.startsWith("es") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft") || v.name.includes("Sabina") || v.name.includes("Jorge"))) ||
                  state.availableVoices.find(v => v.lang.startsWith("es"));

  if (esVoice) {
    utterance.voice = esVoice;
  } else {
    utterance.lang = "es-ES";
  }

  utterance.onstart = () => {
    state.isSpeaking = true;
    updateConversationUI();
    setAgentState("Respondiendo con voz...", true);
    addTrace("TTS_SPEAK", "Generando síntesis de voz", "response");
  };

  utterance.onend = () => {
    state.isSpeaking = false;
    updateConversationUI();
    setAgentState("Listo para escucharte", false);

    // Turn-taking loop: As soon as assistant finishes talking, automatically listen!
    if (state.continuousMode && state.conversationActive) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (!state.isSpeaking && state.continuousMode && state.conversationActive) {
          playTurnChime();
          startListening();
        }
      }, 350); // 350ms natural breathing space
    }
  };

  utterance.onerror = () => {
    state.isSpeaking = false;
    updateConversationUI();
    setAgentState("Listo para escucharte", false);

    if (state.continuousMode && state.conversationActive) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (!state.isSpeaking && state.continuousMode && state.conversationActive) {
          startListening();
        }
      }, 400);
    }
  };

  window.speechSynthesis.speak(utterance);
}

// ============================================================================
// 6. Speech Recognition (El usuario le habla al navegador en bucle fluido)
// ============================================================================
let recognition = null;
let isRecognitionStarting = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const banner = document.getElementById("transcriptLive");
    if (banner) banner.textContent = "Reconocimiento de voz no disponible en este navegador. Usa el teclado.";
    const pill = document.getElementById("supportLabel");
    if (pill) pill.textContent = "WebMCP: Activo (Entrada de texto)";
    return;
  }

  try {
    recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false; // Turn-taking gives maximum precision & prevents echo
    recognition.interimResults = true;

    recognition.onstart = () => {
      isRecognitionStarting = false;
      state.isListening = true;
      updateConversationUI();
      const transcript = document.getElementById("transcriptLive");
      if (transcript) transcript.textContent = "Te escucho... habla libremente";
      setAgentState("Escuchando...", true);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const transcriptEl = document.getElementById("transcriptLive");
      if (transcriptEl) {
        transcriptEl.textContent = finalTranscript || interim || "Escuchando...";
      }

      if (finalTranscript && finalTranscript.trim()) {
        stopListening();
        // If continuous mode was on, ensure conversation is marked active
        if (state.continuousMode) {
          state.conversationActive = true;
        }
        processUserInstruction(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      isRecognitionStarting = false;
      state.isListening = false;
      updateConversationUI();

      if (event.error === 'no-speech') {
        // In continuous conversational mode, brief pauses to think are normal
        if (state.continuousMode && state.conversationActive && !state.isSpeaking) {
          const transcriptEl = document.getElementById("transcriptLive");
          if (transcriptEl) transcriptEl.textContent = "Esperando tu voz... (habla cuando quieras)";
          clearTimeout(state.relistenTimeout);
          state.relistenTimeout = setTimeout(() => {
            if (state.continuousMode && state.conversationActive && !state.isSpeaking && !state.isListening) {
              startListening();
            }
          }, 300);
          return;
        }
      } else if (event.error === 'not-allowed') {
        const transcriptEl = document.getElementById("transcriptLive");
        if (transcriptEl) transcriptEl.textContent = "Permiso de micrófono denegado. Permite el acceso para hablar.";
        pauseConversation();
      } else {
        const transcriptEl = document.getElementById("transcriptLive");
        if (transcriptEl) transcriptEl.textContent = `Voz en espera (${event.error}).`;
      }
    };

    recognition.onend = () => {
      isRecognitionStarting = false;
      state.isListening = false;
      updateConversationUI();

      // If continuous mode is active and we are NOT currently speaking or processing, keep listening loop alive!
      if (state.continuousMode && state.conversationActive && !state.isSpeaking) {
        clearTimeout(state.relistenTimeout);
        state.relistenTimeout = setTimeout(() => {
          if (state.continuousMode && state.conversationActive && !state.isSpeaking && !state.isListening) {
            startListening();
          }
        }, 250);
      }
    };
  } catch (err) {
    console.error("Error initializing SpeechRecognition:", err);
  }
}

function startListening() {
  if (state.isListening || isRecognitionStarting || state.isSpeaking) return;

  if (!recognition) {
    initSpeechRecognition();
  }

  if (!recognition) return;

  try {
    isRecognitionStarting = true;
    recognition.start();
  } catch (e) {
    isRecognitionStarting = false;
    if (e.name === 'InvalidStateError') {
      try { recognition.abort(); } catch (err) {}
      setTimeout(() => {
        if (state.conversationActive && !state.isSpeaking) startListening();
      }, 300);
    }
  }
}

function stopListening() {
  isRecognitionStarting = false;
  state.isListening = false;
  if (recognition) {
    try { recognition.abort(); } catch (err) {}
  }
  updateConversationUI();
}

function startConversation() {
  state.conversationActive = true;
  updateConversationUI();
  playTurnChime();
  startListening();
  addTrace("CONVERSATION", "Modo conversación continua activado", "init");
}

function pauseConversation() {
  state.conversationActive = false;
  clearTimeout(state.relistenTimeout);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopListening();
  updateConversationUI();
  addTrace("CONVERSATION", "Modo conversación pausado", "init");
}

function toggleConversation() {
  if (state.conversationActive) {
    pauseConversation();
  } else {
    startConversation();
  }
}

function toggleListening() {
  // Push-to-talk mode toggle
  if (state.isListening || isRecognitionStarting) {
    stopListening();
    return;
  }
  startListening();
}

function updateConversationUI() {
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

// ============================================================================
// 7. Interactive Widgets: Tasks, Timer & Dynamic Chart
// ============================================================================
function renderTaskList() {
  const listEl = document.getElementById("taskList");
  const badgeEl = document.getElementById("taskCountBadge");
  if (!listEl) return;

  listEl.innerHTML = "";
  if (badgeEl) badgeEl.textContent = `${state.tasks.length} tarea${state.tasks.length === 1 ? '' : 's'}`;

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" />
        <span>${escapeHtml(task.text)}</span>
      </div>
      <button class="task-del-btn" data-id="${task.id}" title="Eliminar tarea">×</button>
    `;
    listEl.appendChild(li);
  });

  // Attach handlers
  listEl.querySelectorAll(".task-checkbox").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      const t = state.tasks.find(x => x.id === id);
      if (t) {
        t.completed = e.target.checked;
        renderTaskList();
      }
    });
  });

  listEl.querySelectorAll(".task-del-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      state.tasks = state.tasks.filter(x => x.id !== id);
      renderTaskList();
    });
  });
}

function startTimer(seconds) {
  stopTimer();
  state.timer.remainingSeconds = seconds;
  state.timer.isRunning = true;

  updateTimerDisplay();
  const badge = document.getElementById("timerStatusBadge");
  if (badge) {
    badge.textContent = "En marcha";
    badge.className = "badge timer-badge active";
  }
  const stopBtn = document.getElementById("timerStopBtn");
  if (stopBtn) stopBtn.disabled = false;

  state.timer.intervalId = setInterval(() => {
    state.timer.remainingSeconds--;
    updateTimerDisplay();

    if (state.timer.remainingSeconds <= 0) {
      stopTimer();
      const alertMsg = "¡Tiempo cumplido en el temporizador!";
      appendChatMessage(alertMsg, "agent");
      speakResponse(alertMsg);
      playBeep();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  state.timer.isRunning = false;
  const badge = document.getElementById("timerStatusBadge");
  if (badge) {
    badge.textContent = "Detenido";
    badge.className = "badge timer-badge";
  }
  const stopBtn = document.getElementById("timerStopBtn");
  if (stopBtn) stopBtn.disabled = true;
}

function resetTimer() {
  stopTimer();
  state.timer.remainingSeconds = 0;
  updateTimerDisplay();
  const badge = document.getElementById("timerStatusBadge");
  if (badge) {
    badge.textContent = "Inactivo";
    badge.className = "badge timer-badge";
  }
}

function updateTimerDisplay() {
  const display = document.getElementById("timerDisplay");
  if (!display) return;
  const m = Math.floor(state.timer.remainingSeconds / 60).toString().padStart(2, '0');
  const s = (state.timer.remainingSeconds % 60).toString().padStart(2, '0');
  display.textContent = `${m}:${s}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // AudioContext might be blocked until gesture
  }
}

// Canvas Data Chart Renderer
function renderChart() {
  const canvas = document.getElementById("dataChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const titleEl = document.getElementById("chartTitle");
  if (titleEl) titleEl.textContent = state.chart.title;

  const tagEl = document.getElementById("chartTypeTag");
  if (tagEl) tagEl.textContent = state.chart.type === "lineas" ? "Gráfico de Líneas" : "Gráfico de Barras";

  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...state.chart.values, 100);
  const count = state.chart.values.length;

  // Grid Lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const labelVal = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "10px Inter";
    ctx.textAlign = "right";
    ctx.fillText(labelVal, padding.left - 8, y + 3);
  }

  // Draw Bars or Lines
  if (state.chart.type === "barras") {
    const barWidth = (chartW / count) * 0.55;
    const step = chartW / count;

    state.chart.values.forEach((val, i) => {
      const x = padding.left + step * i + (step - barWidth) / 2;
      const barH = (val / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "#06b6d4");
      grad.addColorStop(1, "#8b5cf6");

      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barWidth, barH, 4);
      ctx.fill();

      // Top value label
      ctx.fillStyle = "#fff";
      ctx.font = "11px Inter";
      ctx.textAlign = "center";
      ctx.fillText(val, x + barWidth / 2, y - 6);

      // Bottom label
      const label = state.chart.labels[i] || `P${i + 1}`;
      ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
      ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 18);
    });
  } else {
    // Line chart
    ctx.beginPath();
    const step = chartW / (count - 1);
    const points = [];

    state.chart.values.forEach((val, i) => {
      const x = padding.left + step * i;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      points.push({ x, y, val });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Area fill below line
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    areaGrad.addColorStop(0, "rgba(0, 240, 255, 0.25)");
    areaGrad.addColorStop(1, "rgba(0, 240, 255, 0.0)");
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Draw dots
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.stroke();

      const label = state.chart.labels[i] || `P${i + 1}`;
      ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, height - padding.bottom + 18);
    });
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  if (height < radius) radius = height;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ============================================================================
// 8. Animated Soundwave / Audio Visualizer
// ============================================================================
function initAudioVisualizer() {
  const canvas = document.getElementById("audioVisualizer");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let phase = 0;

  function draw() {
    requestAnimationFrame(draw);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const active = state.isListening || state.isSpeaking;
    phase += active ? 0.15 : 0.03;

    const bars = 36;
    const barWidth = width / bars - 4;

    for (let i = 0; i < bars; i++) {
      let amp = 0.15;
      if (state.isListening) {
        amp = 0.4 + 0.5 * Math.sin(phase + i * 0.4) * Math.cos(phase * 0.5);
      } else if (state.isSpeaking) {
        amp = 0.5 + 0.45 * Math.sin(phase * 1.5 + i * 0.3);
      } else {
        amp = 0.1 + 0.08 * Math.sin(phase + i * 0.2);
      }

      amp = Math.max(0.08, Math.abs(amp));
      const barH = amp * (height - 16);
      const x = i * (barWidth + 4) + 2;
      const y = (height - barH) / 2;

      let color1 = "#6366f1";
      let color2 = "#a855f7";
      if (state.isListening) {
        color1 = "#06b6d4";
        color2 = "#3b82f6";
      } else if (state.isSpeaking) {
        color1 = "#ec4899";
        color2 = "#8b5cf6";
      }

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);

      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barWidth, barH, 2);
      ctx.fill();
    }
  }

  draw();
}

// ============================================================================
// 9. UI Utilities, Inspector & Chat Rendering
// ============================================================================
function appendChatMessage(text, sender, toolName = null, aiSource = null) {
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

function addTrace(type, msg, category = "info") {
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

function updateToolsInspector() {
  const listEl = document.getElementById("toolsList");
  const countEl = document.getElementById("toolCount");
  if (!listEl) return;

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

function setAgentState(text, isBusy = false) {
  const stateText = document.getElementById("agentStateText");
  if (stateText) stateText.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 10. Event Listeners & Bootstrapping
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await initWebMCPTools();
  initSpeechSynthesis();
  initSpeechRecognition();
  initAudioVisualizer();
  renderTaskList();
  renderChart();

  // Welcome greeting
  setTimeout(() => {
    appendChatMessage("¡Hola! Soy tu asistente de voz WebMCP con modo de conversación continua. Presiona 'Iniciar Conversación' o la barra espaciadora y podremos hablar con total naturalidad sin pulsar botones.", "agent");
  }, 400);

  // Big Mic / Conversation Button
  const micBtn = document.getElementById("micButton");
  if (micBtn) {
    micBtn.addEventListener("click", (e) => {
      e.currentTarget.blur();
      if (state.continuousMode) {
        toggleConversation();
      } else {
        toggleListening();
      }
    });
  }

  // Continuous Mode Switch
  const continuousToggle = document.getElementById("continuousModeToggle");
  if (continuousToggle) {
    continuousToggle.addEventListener("change", (e) => {
      state.continuousMode = e.target.checked;
      if (!state.continuousMode && state.conversationActive) {
        pauseConversation();
      }
      updateConversationUI();
    });
  }

  // Keyboard shortcut: Spacebar to toggle conversation (when not typing in an input or activating a button)
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      if (e.repeat) return; // Ignore holding space
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") {
        return;
      }
      e.preventDefault();
      if (state.continuousMode) {
        toggleConversation();
      } else {
        toggleListening();
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
        renderTaskList();
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
  if (timerStopBtn) timerStopBtn.addEventListener("click", stopTimer);
  if (timerResetBtn) timerResetBtn.addEventListener("click", resetTimer);

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
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      document.body.className = e.target.value;
      renderChart();
    });
  }

  // Inspector Tabs
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

  // AI Brain Config Modal Wiring
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

      localStorage.setItem("webmcp_ai_provider", aiConfig.provider);
      localStorage.setItem("webmcp_ai_key", aiConfig.apiKey);
      localStorage.setItem("webmcp_ai_endpoint", aiConfig.endpoint);

      updateBadgeLabel();
      aiConfigModal.style.display = "none";
      addTrace("AI_CONFIG", `Cerebro configurado: ${aiConfig.provider}`, "init");
      appendChatMessage(`Configuración guardada. Ahora el asistente responderá con el proveedor: ${aiConfig.provider.toUpperCase()}.`, "agent", null, "Configuración");
    });
  }
});

/**
 * AI Brain - Real Conversational Intelligence & WebMCP Tool Reasoner
 * 
 * Complies with the W3C Web Model Context Protocol specification draft.
 * Integrates true conversational AI models (Google Gemini, Free Cloud AI,
 * Chrome Built-in AI, OpenAI/Groq, and Ollama) with native tool calling
 * to fulfill user tasks and conduct fluid natural conversations.
 */

// ============================================================================
// 1. Dialogue History & Configuration
// ============================================================================
export const dialogueHistory = [];

export const SYSTEM_PROMPT = `Eres un asistente de inteligencia artificial conversacional integrado directamente en el navegador web mediante el protocolo WebMCP.
Tienes una personalidad cálida, inteligente, empática, lúcida y natural, al nivel de ChatGPT o Gemini.

REGLAS FUNDAMENTALES DE CONVERSACIÓN:
1. Habla SIEMPRE en español de manera completamente natural, fluida, educada y humana.
2. Sé conciso y directo: tus respuestas deben tener habitualmente entre 1 y 3 oraciones breves, ideales para ser escuchadas por voz en el navegador.
3. Si el usuario te saluda, conversa contigo o te hace preguntas libres de cualquier índole (ciencia, tecnología, historia, opiniones, filosofía, consejos o reflexiones), responde con tu propia inteligencia genuina de manera interesante y cercana. NUNCA respondas con frases acartonadas o robóticas.
4. Tienes a tu disposición herramientas WebMCP para controlar la página web actual en tiempo real:
   - cambiar_tema: {"tema": "midnight" | "cyberpunk" | "emerald" | "sunset"}
   - gestionar_tareas: {"accion": "agregar" | "completar" | "limpiar" | "listar", "texto": "descripción de la tarea"}
   - controlar_temporizador: {"accion": "iniciar" | "detener" | "reiniciar", "segundos": número}
   - generar_grafico: {"titulo": "...", "tipo": "barras" | "lineas"}
   - leer_contenido_pantalla: {"seccion": "tareas" | "grafico" | "general"}
   - consultar_herramientas: {}
5. Si el usuario te solicita realizar alguna de estas acciones (o una tarea visual en la página), debes indicar la herramienta correspondiente para ejecutarla y acompañarla de una confirmación hablada natural y cordial.`;

// ============================================================================
// 2. Central Conversational Intelligence & Tool Calling Dispatcher
// ============================================================================
export async function askUniversalIntelligence(query, aiConfig, availableTools = []) {
  if (!query || !query.trim()) {
    return { text: "No logré escucharte con claridad. ¿Podrías repetirlo?", tool: null, args: null, source: "Sistema" };
  }

  const cleanQuery = query.trim();

  // Register user utterance in conversation history
  dialogueHistory.push({ role: "user", content: cleanQuery });
  if (dialogueHistory.length > 20) dialogueHistory.shift();

  let responseObj = null;
  const provider = (aiConfig && aiConfig.provider) ? aiConfig.provider : "free_cloud";

  // Provider 1: Google Gemini API (Recommended for WebMCP: ultra fast & native tool calling)
  if (provider === "gemini" && aiConfig && aiConfig.apiKey) {
    try {
      responseObj = await queryGeminiWithTools(aiConfig.apiKey, dialogueHistory, availableTools);
    } catch (err) {
      console.warn("Error en Gemini API, intentando con proveedor libre:", err);
    }
  }

  // Provider 2: Chrome Built-in AI (Gemini Nano on-device in browser)
  if (!responseObj && (provider === "chrome_builtin" || (typeof window !== "undefined" && window.ai && window.ai.languageModel))) {
    try {
      responseObj = await queryChromeBuiltInAI(dialogueHistory, cleanQuery, availableTools);
    } catch (err) {
      console.warn("Error o no disponible Chrome Built-in AI:", err);
    }
  }

  // Provider 3: OpenAI / Groq / OpenRouter API
  if (!responseObj && (provider === "openai" || provider === "groq") && aiConfig && aiConfig.apiKey) {
    try {
      responseObj = await queryOpenAIWithTools(aiConfig.apiKey, aiConfig.endpoint, dialogueHistory, availableTools);
    } catch (err) {
      console.warn("Error en OpenAI / Groq API:", err);
    }
  }

  // Provider 4: Ollama Local API
  if (!responseObj && provider === "ollama") {
    try {
      responseObj = await queryOllamaWithTools(aiConfig.endpoint, dialogueHistory, availableTools);
    } catch (err) {
      console.warn("Error en Ollama Local:", err);
    }
  }

  // Provider 5: Free Cloud AI (Zero-config genuine LLM - no API key needed)
  if (!responseObj) {
    try {
      responseObj = await queryFreeCloudAI(dialogueHistory, availableTools);
    } catch (err) {
      console.warn("Error en Free Cloud AI:", err);
    }
  }

  // Provider 6: Resilient Semantic Intelligence Engine (Ensures tasks NEVER fail even offline)
  if (!responseObj) {
    responseObj = evaluateResilientSemanticEngine(cleanQuery);
  }

  // Save AI response in conversation memory
  if (responseObj && responseObj.text) {
    dialogueHistory.push({ role: "assistant", content: responseObj.text });
    if (dialogueHistory.length > 20) dialogueHistory.shift();
  }

  return responseObj;
}

// ============================================================================
// 3. Google Gemini Native Tool Calling & Conversation (REST API)
// ============================================================================
export async function queryGeminiWithTools(apiKey, history, availableTools) {
  // Format function declarations from WebMCP tools
  const functionDeclarations = availableTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: convertSchemaToGemini(tool.inputSchema)
  }));

  const contents = history.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    }
  };

  if (functionDeclarations.length > 0) {
    requestBody.tools = [{ functionDeclarations }];
  }

  // Try Gemini 2.0 Flash first, fallback to Gemini 1.5 Flash
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const candidate = data.candidates && data.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts) continue;

      let toolToCall = null;
      let toolArgs = {};
      let conversationalReply = "";

      for (const part of candidate.content.parts) {
        if (part.functionCall) {
          toolToCall = part.functionCall.name;
          toolArgs = part.functionCall.args || {};
        } else if (part.text) {
          conversationalReply += part.text;
        }
      }

      conversationalReply = conversationalReply.trim();
      if (!conversationalReply && toolToCall) {
        conversationalReply = getDefaultConfirmationForTool(toolToCall, toolArgs);
      }

      return {
        tool: toolToCall,
        args: toolArgs,
        text: conversationalReply,
        source: `Gemini AI (${model})`
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("Gemini API falló");
}

function convertSchemaToGemini(schema) {
  if (!schema) return { type: "OBJECT", properties: {} };
  return {
    type: "OBJECT",
    description: schema.description || "Parámetros de la herramienta",
    properties: schema.properties || {},
    required: schema.required || []
  };
}

// ============================================================================
// 4. Free Cloud AI Provider (Zero-config, Real Generative LLM via Pollinations)
// ============================================================================
export async function queryFreeCloudAI(history, availableTools) {
  const toolsSpecText = availableTools.map(t => {
    return `- ${t.name}: ${t.description} (Parámetros: ${JSON.stringify(t.inputSchema?.properties || {})})`;
  }).join("\n");

  const systemMessage = `${SYSTEM_PROMPT}

HERRAMIENTAS WEBMCP DISPONIBLES EN LA PÁGINA:
${toolsSpecText}

INSTRUCCIÓN ESPECIAL PARA ACCIONES EN LA PÁGINA:
Si el usuario te pide una tarea o acción que coincide con una herramienta (como cambiar el tema visual, agregar o completar tareas, poner un temporizador, o generar un gráfico), incluye al principio de tu respuesta la etiqueta de acción:
[TOOL: nombre_herramienta({"parámetro": "valor"})]
Y a continuación, escribe tu respuesta hablada natural y cordial en español confirmando lo que hiciste o comentando al respecto.

Si el usuario SOLO está charlando, saludando, preguntando sobre ciencia, historia, opiniones, o conversando libremente, responde con tu conversación natural de IA genuina (SIN ninguna etiqueta [TOOL]).`;

  const messages = [
    { role: "system", content: systemMessage },
    ...history.slice(-10).map(msg => ({ role: msg.role, content: msg.content }))
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: "openai-fast"
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Free Cloud AI error: ${response.status}`);
  }

  const data = await response.json();
  const replyContent = data.choices && data.choices[0]?.message?.content;
  if (!replyContent) return null;

  return parseToolActionFromText(replyContent, "IA Conversacional Libre");
}

// ============================================================================
// 5. OpenAI / Groq / Compatible API Provider
// ============================================================================
export async function queryOpenAIWithTools(apiKey, endpoint, history, availableTools) {
  const cleanEndpoint = (endpoint || "https://api.openai.com/v1").replace(/\/$/, "");
  
  const tools = availableTools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || { type: "object", properties: {} }
    }
  }));

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-10).map(msg => ({ role: msg.role, content: msg.content }))
  ];

  const bodyPayload = {
    model: cleanEndpoint.includes("groq") ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
    messages,
    temperature: 0.7
  };

  if (tools.length > 0) {
    bodyPayload.tools = tools;
  }

  const response = await fetch(`${cleanEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI / Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const msg = data.choices && data.choices[0]?.message;
  if (!msg) return null;

  let toolToCall = null;
  let toolArgs = {};

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const call = msg.tool_calls[0];
    toolToCall = call.function.name;
    try {
      toolArgs = JSON.parse(call.function.arguments || "{}");
    } catch (e) {
      toolArgs = {};
    }
  }

  let text = (msg.content || "").trim();
  if (!text && toolToCall) {
    text = getDefaultConfirmationForTool(toolToCall, toolArgs);
  }

  return {
    tool: toolToCall,
    args: toolArgs,
    text,
    source: "OpenAI / Groq"
  };
}

// ============================================================================
// 6. Chrome Built-In AI (Gemini Nano on-device in browser)
// ============================================================================
export async function queryChromeBuiltInAI(history, query, availableTools) {
  if (typeof window === "undefined" || !window.ai || !window.ai.languageModel) {
    return null;
  }

  const capabilities = await window.ai.languageModel.capabilities();
  if (capabilities.available === "no") return null;

  const session = await window.ai.languageModel.create({
    systemPrompt: SYSTEM_PROMPT
  });

  const promptText = `El usuario dice: "${query}". Si es una orden para la página, emite [TOOL: nombre({"arg":"val"})] y tu respuesta cordial. Si es conversación, responde con naturalidad.`;
  const reply = await session.prompt(promptText);

  return parseToolActionFromText(reply, "Chrome Built-in AI (Gemini Nano)");
}

// ============================================================================
// 7. Ollama Local API Provider
// ============================================================================
export async function queryOllamaWithTools(endpoint, history, availableTools) {
  const cleanEndpoint = (endpoint || "http://localhost:11434").replace(/\/$/, "");

  const toolsSpecText = availableTools.map(t => `- ${t.name}: ${t.description}`).join("\n");
  const system = `${SYSTEM_PROMPT}\nHerramientas WebMCP:\n${toolsSpecText}\nSi ejecutas una acción, pon [TOOL: nombre({"arg":"valor"})]`;

  const messages = [
    { role: "system", content: system },
    ...history.slice(-8).map(msg => ({ role: msg.role, content: msg.content }))
  ];

  const response = await fetch(`${cleanEndpoint}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      messages,
      stream: false
    })
  });

  if (!response.ok) throw new Error(`Ollama HTTP error ${response.status}`);
  const data = await response.json();
  const reply = data.message && data.message.content;
  if (!reply) return null;

  return parseToolActionFromText(reply, "Ollama Local (Llama3)");
}

// ============================================================================
// 8. Tool Action Parser & Helpers
// ============================================================================
function parseToolActionFromText(text, sourceName) {
  let toolToCall = null;
  let toolArgs = {};
  let cleanText = text;

  // Pattern: [TOOL: nombre_herramienta({ ... })]
  const toolMatch = text.match(/\[TOOL:\s*([a-zA-Z0-9_]+)\s*\((.*?)\)\]/i);
  if (toolMatch) {
    toolToCall = toolMatch[1];
    const rawArgs = toolMatch[2];
    try {
      toolArgs = JSON.parse(rawArgs);
    } catch (e) {
      toolArgs = {};
    }
    cleanText = text.replace(toolMatch[0], "").trim();
  }

  if (!cleanText && toolToCall) {
    cleanText = getDefaultConfirmationForTool(toolToCall, toolArgs);
  }

  return {
    tool: toolToCall,
    args: toolArgs,
    text: cleanText,
    source: sourceName
  };
}

function getDefaultConfirmationForTool(toolName, args) {
  switch (toolName) {
    case "cambiar_tema":
      return `¡Por supuesto! He cambiado el estilo visual a ${args.tema || "el tema seleccionado"}.`;
    case "gestionar_tareas":
      if (args.accion === "agregar") return `He agregado "${args.texto || "la nueva tarea"}" a tu lista.`;
      if (args.accion === "completar") return "He marcado la tarea como completada.";
      if (args.accion === "limpiar") return "He limpiado todas las tareas de la lista.";
      return "Acción de tareas ejecutada.";
    case "controlar_temporizador":
      if (args.accion === "iniciar") return `Temporizador iniciado por ${args.segundos || 30} segundos.`;
      if (args.accion === "detener") return "Temporizador detenido.";
      return "Temporizador reiniciado.";
    case "generar_grafico":
      return `He actualizado el gráfico en pantalla.`;
    case "leer_contenido_pantalla":
      return "Consultando el estado de la pantalla...";
    default:
      return "He ejecutado la herramienta solicitada en la página.";
  }
}

// ============================================================================
// 9. Resilient Semantic Engine (Ensures tasks are ALWAYS fulfilled even offline)
// ============================================================================
export function evaluateResilientSemanticEngine(query) {
  const norm = query.toLowerCase().replace(/[¿?¡!]/g, "").trim();

  // 1. Theme Change
  if (/\b(cambia(r)?|pon(er)?|modifica(r)?|aplica(r)?)\s+(el\s+)?(tema|color|estilo|fondo)\b/i.test(norm) || /\b(tema|modo)\s+(cyberpunk|esmeralda|sunset|midnight|oscuro|ne[oó]n|matrix|verde|rosa)\b/i.test(norm)) {
    let tema = "midnight";
    let nombre = "Medianoche";
    if (norm.includes("cyber") || norm.includes("neón") || norm.includes("neon") || norm.includes("futurista")) {
      tema = "cyberpunk";
      nombre = "Cyberpunk Neón";
    } else if (norm.includes("esmeralda") || norm.includes("matrix") || norm.includes("verde")) {
      tema = "emerald";
      nombre = "Esmeralda Matrix";
    } else if (norm.includes("sunset") || norm.includes("atardecer") || norm.includes("rosa") || norm.includes("violeta")) {
      tema = "sunset";
      nombre = "Atardecer Violeta";
    }
    return {
      tool: "cambiar_tema",
      args: { tema },
      text: `¡Listo! He cambiado el diseño visual a ${nombre}. ¿Qué te parece cómo luce?`,
      source: "Motor WebMCP"
    };
  }

  // 2. Task Management
  if (/\b(agrega|crea|a[ñn]ade|pon|nueva|anota|recordar)\s+(una\s+)?(tarea|nota|recordatorio)\b/i.test(norm) || /\b(completa|marcar|termina|tacha)\s+(la\s+)?tarea\b/i.test(norm) || /\b(limpia|borra|elimina)\s+(todas\s+las\s+)?tareas\b/i.test(norm)) {
    if (norm.includes("complet") || norm.includes("marcar") || norm.includes("termina") || norm.includes("tacha")) {
      return {
        tool: "gestionar_tareas",
        args: { accion: "completar" },
        text: "He marcado la tarea como completada en tu lista.",
        source: "Motor WebMCP"
      };
    }
    if (norm.includes("limpia") || norm.includes("borra") || norm.includes("elimina")) {
      return {
        tool: "gestionar_tareas",
        args: { accion: "limpiar" },
        text: "He eliminado todas las tareas de la lista.",
        source: "Motor WebMCP"
      };
    }

    let textClean = query
      .replace(/^(agrega|crea|añade|nueva|pon|anota|recordar)\s+(una\s+)?(tarea|nota|recordatorio)(\s*:|\s+que|\s+para)?\s*/i, "")
      .replace(/[¿?¡!]/g, "")
      .trim();

    if (!textClean || textClean.toLowerCase() === "tarea") {
      textClean = "Nueva tarea registrada por voz";
    }

    return {
      tool: "gestionar_tareas",
      args: { accion: "agregar", texto: textClean },
      text: `He agregado "${textClean}" a tu lista de tareas.`,
      source: "Motor WebMCP"
    };
  }

  // 3. Timer Control
  if (/\b(inicia|pon|activa|configura|cuenta\s+regresiva)\s+(un\s+)?temporizador\b/i.test(norm) || /\b(temporizador|alarma)\s+(de\s+)?\d+\s*(segundos|minuto)/i.test(norm) || /\b(det[eé]n|para|cancela|reinicia)\s+(el\s+)?temporizador\b/i.test(norm)) {
    if (norm.includes("detén") || norm.includes("para") || norm.includes("cancela") || norm.includes("stop")) {
      return {
        tool: "controlar_temporizador",
        args: { accion: "detener" },
        text: "Temporizador detenido.",
        source: "Motor WebMCP"
      };
    }
    if (norm.includes("reinicia") || norm.includes("reset")) {
      return {
        tool: "controlar_temporizador",
        args: { accion: "reiniciar" },
        text: "Temporizador reiniciado.",
        source: "Motor WebMCP"
      };
    }

    const numMatch = query.match(/\d+/);
    let seconds = 30;
    if (numMatch) {
      let val = parseInt(numMatch[0], 10);
      if (norm.includes("minuto")) val *= 60;
      seconds = val;
    }
    return {
      tool: "controlar_temporizador",
      args: { accion: "iniciar", segundos },
      text: `Iniciando temporizador de ${seconds} segundos.`,
      source: "Motor WebMCP"
    };
  }

  // 4. Chart Generation
  if (/\b(genera|crea|muestra|haz|dibuja|actualiza)\s+(un\s+)?gr[aá]fico\b/i.test(norm) || /\b(gr[aá]fico\s+de\s+(barras|l[ií]neas|ventas|m[eé]tricas))\b/i.test(norm)) {
    const isLines = norm.includes("línea") || norm.includes("lineas");
    return {
      tool: "generar_grafico",
      args: {
        titulo: norm.includes("ventas") ? "Ventas Trimestrales" : "Métricas de Actividad",
        tipo: isLines ? "lineas" : "barras"
      },
      text: `He generado un nuevo gráfico de ${isLines ? "líneas" : "barras"} con datos dinámicos.`,
      source: "Motor WebMCP"
    };
  }

  // 5. Screen Reading
  if (/\b(lee|resume|qu[eé] hay en)\s+(la\s+)?pantalla\b/i.test(norm)) {
    return {
      tool: "leer_contenido_pantalla",
      args: { seccion: norm.includes("tarea") ? "tareas" : norm.includes("grafico") ? "grafico" : "general" },
      text: "Revisando el contenido visual de la página...",
      source: "Motor WebMCP"
    };
  }

  // 6. Tools Query
  if (/\b(qu[eé] herramientas|lista de herramientas|qu[eé] puedes controlar|comandos disponibles)\b/i.test(norm)) {
    return {
      tool: "consultar_herramientas",
      args: {},
      text: "Tengo herramientas WebMCP para cambiar temas visuales, gestionar tu lista de tareas, controlar un temporizador y crear gráficos dinámicos en tiempo real.",
      source: "Motor WebMCP"
    };
  }

  // Conversational response
  const responses = [
    `¡Hola! Estoy listo para ayudarte. Puedes pedirme acciones como iniciar un temporizador, cambiar temas o consultar herramientas.`,
    `Te escucho con atención. Cuéntame qué tarea deseas realizar en la página o sobre qué te gustaría hablar.`,
    `¡Aquí estoy! Dime qué necesitas y lo resolvemos enseguida.`
  ];
  return {
    tool: null,
    args: null,
    text: responses[Math.floor(Math.random() * responses.length)],
    source: "Asistente Conversacional"
  };
}

// ============================================================================
// 10. AI Configuration Persistence
// ============================================================================
export function loadAiConfig() {
  try {
    const saved = localStorage.getItem("webmcp_ai_config");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    provider: "free_cloud", // Real Generative LLM by default, or "gemini" if API key is provided
    apiKey: "",
    endpoint: "http://localhost:11434"
  };
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem("webmcp_ai_config", JSON.stringify(config));
  } catch (e) {}
}

/**
 * AI Brain - Universal Knowledge and Reasoning Gateway
 * 
 * Provides open encyclopedic retrieval (Wikipedia API), mathematical evaluation,
 * temporal awareness, conversational reasoning, and external LLM connections (Gemini, Ollama, OpenAI).
 */

export const SPECIALIZED_KNOWLEDGE = [
  // WebMCP & MCP Fundamentals
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

  // Everyday Science & Nature Questions
  {
    keywords: ["por que el cielo es azul", "por qué el cielo es azul", "cielo es azul", "porque el cielo es azul"],
    answer: "El cielo se ve azul debido a la dispersión de Rayleigh: las moléculas de la atmósfera terrestre dispersan la luz solar de longitud de onda más corta, como el azul y el violeta, en todas direcciones con mucha más fuerza que los otros colores."
  },
  {
    keywords: ["por que llueve", "por qué llueve", "porque llueve", "origen de la lluvia", "ciclo del agua"],
    answer: "La lluvia se produce cuando el calor del sol evapora el agua de mares y ríos, la cual sube a la atmósfera y se enfría formando nubes. Al juntarse y volverse demasiado pesadas para flotar en el aire, caen por gravedad en forma de gotas de agua."
  },
  {
    keywords: ["que es la gravedad", "qué es la gravedad", "ley de la gravedad"],
    answer: "La gravedad es la fuerza natural fundamental por la cual los objetos con masa se atraen entre sí. Albert Einstein demostró en su teoría de la relatividad general que la gravedad es en realidad la curvatura del espacio-tiempo causada por la masa y la energía."
  },
  {
    keywords: ["velocidad de la luz", "a que velocidad viaja la luz", "cuanto viaja la luz"],
    answer: "La velocidad de la luz en el vacío es de exactamente 299,792 kilómetros por segundo, lo que equivale aproximadamente a 300,000 kilómetros por segundo."
  },
  {
    keywords: ["distancia a la luna", "distancia de la tierra a la luna", "que tan lejos esta la luna"],
    answer: "La distancia promedio entre la Tierra y la Luna es de aproximadamente 384,400 kilómetros."
  },
  {
    keywords: ["que es el adn", "qué es el adn", "acido desoxirribonucleico"],
    answer: "El ADN o ácido desoxirribonucleico es la molécula compleja presente en el núcleo celular que almacena las instrucciones genéticas biológicas usadas en el desarrollo y funcionamiento de todos los seres vivos."
  },
  {
    keywords: ["que es la fotosintesis", "qué es la fotosíntesis", "fotosintesis"],
    answer: "La fotosíntesis es el proceso bioquímico mediante el cual las plantas, algas y ciertas bacterias transforman la luz solar, el agua y el dióxido de carbono en azúcares nutritivos y liberan oxígeno al ambiente."
  },
  {
    keywords: ["que es un agujero negro", "qué es un agujero negro", "agujeros negros"],
    answer: "Un agujero negro es una región del espacio donde la concentración de masa es tan densa que nada, ni siquiera la luz, puede escapar de su inmensa atracción gravitatoria."
  },

  // Conversational & Fun
  {
    keywords: ["quien eres", "quién eres", "como te llamas", "cómo te llamas", "que eres", "qué eres"],
    answer: "Soy tu asistente de voz WebMCP. Estoy conectado directamente a este navegador web para responder cualquier pregunta libre y controlar herramientas interactivas en pantalla mediante comandos de voz."
  },
  {
    keywords: ["chiste", "cuentame un chiste", "dime un chiste"],
    answer: "Había una vez un programador que fue a la playa... y al ver una ola gigante, ¡intentó hacerle un 'catch' para que no se cayera el servidor!"
  },
  {
    keywords: ["poema", "dime un poema", "recita un poema"],
    answer: "Entre líneas de código y pulsos de luz, viaja tu voz con nitidez y virtud; no hay pantalla que impida nuestra conexión, donde la web y la mente forman una canción."
  },
  {
    keywords: ["consejo", "dame un consejo", "un buen consejo"],
    answer: "El mejor consejo es dar pequeños pasos consistentes cada día: la maestría en cualquier habilidad no surge de un momento heroico, sino de la práctica constante con curiosidad y paciencia."
  },
  {
    keywords: ["sentido de la vida", "cuál es el sentido de la vida", "cual es el sentido de la vida"],
    answer: "Según el filósofo Viktor Frankl, el sentido de la vida lo define cada persona a través de sus experiencias, los vínculos que crea, las metas que persigue y el significado que decide otorgar a sus desafíos."
  }
];

/**
 * Universal Intelligence Pipeline:
 * 1. Arithmetic evaluation
 * 2. Temporal/Calendar queries
 * 3. User configured LLM (Gemini, Ollama, OpenAI)
 * 4. Specialized Knowledgebase
 * 5. Live MediaWiki/Wikipedia plain text search
 * 6. Dynamic Generative Synthesizer
 */
export async function askUniversalIntelligence(query, aiConfig) {
  const norm = query.toLowerCase().replace(/[¿?¡!]/g, "").trim();

  // 1. Math Evaluation
  const mathResult = tryMathCalculation(norm);
  if (mathResult) {
    return { text: mathResult, source: "Cálculo Matemático" };
  }

  // 2. Real-time Date / Time
  const dateTimeResult = tryDateTimeQuery(norm);
  if (dateTimeResult) {
    return { text: dateTimeResult, source: "Reloj del Sistema" };
  }

  // 3. Geography & Capitals Resolution
  const capitalResult = tryGeographyCapital(norm);
  if (capitalResult) {
    return { text: capitalResult, source: "Geografía Mundial" };
  }

  // 4. External LLM Provider (if configured by user in AI Modal)
  if (aiConfig && aiConfig.provider === "gemini" && aiConfig.apiKey) {
    try {
      const llmAns = await queryGeminiAPI(aiConfig.apiKey, query);
      if (llmAns) return { text: llmAns, source: "Gemini AI" };
    } catch (err) {
      console.warn("Gemini query error:", err);
    }
  } else if (aiConfig && aiConfig.provider === "ollama") {
    try {
      const ollamaAns = await queryOllamaAPI(aiConfig.endpoint, query);
      if (ollamaAns) return { text: ollamaAns, source: "Ollama Local" };
    } catch (err) {
      console.warn("Ollama query error:", err);
    }
  } else if (aiConfig && aiConfig.provider === "openai" && aiConfig.apiKey) {
    try {
      const openAiAns = await queryOpenAIAPI(aiConfig.apiKey, aiConfig.endpoint, query);
      if (openAiAns) return { text: openAiAns, source: "OpenAI" };
    } catch (err) {
      console.warn("OpenAI query error:", err);
    }
  }

  // 4. Specialized Curated Knowledge
  for (const item of SPECIALIZED_KNOWLEDGE) {
    if (item.keywords.some(kw => norm.includes(kw))) {
      return { text: item.answer, source: "Conocimiento WebMCP" };
    }
  }

  // 5. Live Encyclopedic Search (Wikipedia MediaWiki API)
  const wikiAnswer = await fetchLiveWikipediaKnowledge(query);
  if (wikiAnswer) {
    return { text: wikiAnswer, source: "Wikipedia en Vivo" };
  }

  // 6. Dynamic Generative Concept Explainer
  const synthesized = synthesizeConceptResponse(query);
  return {
    text: synthesized,
    source: "Asistente Inteligente"
  };
}

/**
 * Evaluates spoken arithmetic expressions
 */
export function tryMathCalculation(text) {
  // Regex patterns for math operations
  // e.g. "cuanto es 25 por 4", "cuanto es 15 + 30", "50 / 2", "raiz de 64"
  const clean = text
    .replace(/^(cuánto es|cuanto es|calcula|calculame|suma|resta|multiplica|divide|resultado de)\s+/i, "")
    .replace(/[?¿]/g, "")
    .trim();

  // Percentage: "el 20% de 500" o "20 por ciento de 500"
  const pctMatch = clean.match(/(?:el\s+)?(\d+(?:\.\d+)?)\s*(?:%|por\s*ciento)\s*(?:de)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const p = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = (p / 100) * total;
    return `El ${p}% de ${total} es ${Number(res.toFixed(2))}.`;
  }

  // Square root: "raiz cuadrada de 144" o "raiz de 81"
  const sqrtMatch = clean.match(/(?:raíz|raiz)(?:\s+cuadrada)?\s+de\s+(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    return `La raíz cuadrada de ${val} es ${Number(res.toFixed(2))}.`;
  }

  // Basic arithmetic: "+", "-", "*", "/", "por", "entre", "más", "menos"
  const mathPattern = /^\s*(\d+(?:\.\d+)?)\s*(más|\+|menos|-|por|\*|x|dividido\s+entre|dividido|entre|\/)\s*(\d+(?:\.\d+)?)\s*$/i;
  const match = clean.match(mathPattern);
  if (match) {
    const a = parseFloat(match[1]);
    const op = match[2].toLowerCase();
    const b = parseFloat(match[3]);
    let result = 0;
    let opName = "más";

    if (op === "+" || op === "más" || op === "mas") {
      result = a + b;
      opName = "más";
    } else if (op === "-" || op === "menos") {
      result = a - b;
      opName = "menos";
    } else if (op === "*" || op === "x" || op === "por") {
      result = a * b;
      opName = "por";
    } else if (op === "/" || op.includes("dividido") || op === "entre") {
      if (b === 0) return "No es posible dividir por cero.";
      result = a / b;
      opName = "dividido entre";
    }

    return `El resultado de ${a} ${opName} ${b} es ${Number(result.toFixed(2))}.`;
  }

  return null;
}

/**
 * Returns current date, time, and calendar data
 */
export function tryDateTimeQuery(text) {
  const isTime = text.includes("hora es") || text.includes("la hora") || text.includes("hora tienes");
  const isDate = text.includes("qué día es") || text.includes("que dia es") || text.includes("qué fecha") || text.includes("que fecha") || text.includes("año estamos");

  if (!isTime && !isDate) return null;

  const now = new Date();
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const dayName = days[now.getDay()];
  const dayNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  if (isTime && isDate) {
    return `Son las ${hours}:${minutes} del ${dayName} ${dayNum} de ${monthName} de ${year}.`;
  } else if (isTime) {
    return `En este momento son las ${hours}:${minutes}.`;
  } else {
    return `Hoy es ${dayName} ${dayNum} de ${monthName} de ${year}.`;
  }
}

/**
 * Resolves country capital queries
 */
export function tryGeographyCapital(text) {
  if (!text.includes("capital")) return null;
  const capitals = {
    "francia": "París", "españa": "Madrid", "italia": "Roma", "alemania": "Berlín",
    "reino unido": "Londres", "inglaterra": "Londres", "portugal": "Lisboa",
    "estados unidos": "Washington D. C.", "eeuu": "Washington D. C.", "ee.uu.": "Washington D. C.",
    "canadá": "Ottawa", "canada": "Ottawa", "méxico": "Ciudad de México", "mexico": "Ciudad de México",
    "argentina": "Buenos Aires", "brasil": "Brasilia", "chile": "Santiago",
    "colombia": "Bogotá", "perú": "Lima", "peru": "Lima", "uruguay": "Montevideo",
    "paraguay": "Asunción", "bolivia": "Sucre y La Paz", "venezuela": "Caracas",
    "ecuador": "Quito", "japón": "Tokio", "japon": "Tokio", "china": "Pekín",
    "rusia": "Moscú", "australia": "Canberra", "grecia": "Atenas", "egipto": "El Cairo"
  };
  for (const [country, cap] of Object.entries(capitals)) {
    if (text.includes(country)) {
      const cTitle = country.charAt(0).toUpperCase() + country.slice(1);
      return `La capital de ${cTitle} es ${cap}.`;
    }
  }
  return null;
}

/**
 * Live Wikipedia Search via MediaWiki API with automated redirects and clean plain-text extracts
 */
export async function fetchLiveWikipediaKnowledge(query) {
  try {
    let cleanQ = query
      .replace(/^(qué es|que es|quién fue|quien fue|quién es|quien es|cuéntame sobre|cuentame sobre|explícame|explicame|dime sobre|defina|definición de|hablame de|háblame de|sabes qué es|sabes que es|un|una|el|la)\s+/i, '')
      .replace(/[?¿!¡]/g, '')
      .trim();

    if (!cleanQ || cleanQ.length < 2) return null;

    // Search top matching article
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&origin=*`;
    const sRes = await fetch(searchUrl);
    const sData = await sRes.json();

    if (sData.query && sData.query.search && sData.query.search.length > 0) {
      const topTitle = sData.query.search[0].title;

      // Fetch introductory plain extract with redirects resolved
      const extractUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(topTitle)}&format=json&origin=*`;
      const eRes = await fetch(extractUrl);
      const eData = await eRes.json();

      if (eData.query && eData.query.pages) {
        const page = Object.values(eData.query.pages)[0];
        if (page && page.extract) {
          // Clean phonetic guides, brackets, dates in parentheses
          let cleanExtract = page.extract
            .replace(/\s*\([^)]*\)/g, "")
            .replace(/\[\d+\]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          const sentences = cleanExtract.split(/(?<=[.!?])\s+/);
          const topSentences = sentences.slice(0, 2).join(' ').trim();
          if (topSentences.length > 20) {
            return topSentences;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error fetching Wikipedia knowledge:", err);
  }
  return null;
}

/**
 * Generates an articulate, friendly spoken synthesis for general conversation
 */
export function synthesizeConceptResponse(query) {
  const norm = query.toLowerCase();

  if (norm.includes("cómo funciona") || norm.includes("como funciona")) {
    return `Para responder a cómo funciona "${query}": los sistemas complejos suelen operar coordinando componentes individuales que intercambian señales o energía para cumplir un objetivo conjunto.`;
  }

  if (norm.includes("por qué") || norm.includes("porque")) {
    return `Sobre "${query}": este fenómeno ocurre debido a la interacción de fuerzas físicas, biológicas o lógicas que rigen el comportamiento de la naturaleza y la tecnología.`;
  }

  if (norm.includes("opinas") || norm.includes("te parece") || norm.includes("qué piensas")) {
    return `Me parece un tema fascinante. Como inteligencia artificial conectada a la web con WebMCP, mi objetivo es ayudarte a analizarlo con objetividad y brindarte herramientas prácticas.`;
  }

  return `Entendido. Sobre tu consulta: "${query}", puedes hacerme cualquier pregunta de ciencia, historia, cálculo o pedirme que interactúe con los controles de la página web.`;
}

// ============================================================================
// LLM Provider Integrations (Gemini, Ollama, OpenAI)
// ============================================================================
export async function queryGeminiAPI(apiKey, prompt) {
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

export async function queryOllamaAPI(endpoint, prompt) {
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

export async function queryOpenAIAPI(apiKey, endpoint, prompt) {
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

export function loadAiConfig() {
  try {
    const saved = localStorage.getItem("webmcp_ai_config");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    provider: "autonomous",
    apiKey: "",
    endpoint: "http://localhost:11434"
  };
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem("webmcp_ai_config", JSON.stringify(config));
  } catch (e) {}
}

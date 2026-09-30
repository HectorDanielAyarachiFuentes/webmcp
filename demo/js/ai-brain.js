/**
 * AI Brain - True Conversational Intelligence Engine
 * 
 * Provides natural conversational dialogue (like ChatGPT and Gemini),
 * multi-turn dialogue memory, mathematical evaluation, temporal awareness,
 * curated science & culture knowledge, and external LLM connections (Gemini, Ollama, OpenAI, Groq).
 */

// ============================================================================
// 1. Conversational Memory & User Profile
// ============================================================================
export const dialogueHistory = [];

export const userProfile = {
  name: (typeof localStorage !== "undefined" && localStorage.getItem) ? localStorage.getItem("webmcp_user_name") : null
};

export const SYSTEM_PROMPT = `Eres un asistente de voz conversacional de última generación, inteligente, cálido, empático y natural, idéntico a ChatGPT o Gemini.
Estás integrado directamente en la pestaña del navegador mediante el protocolo WebMCP.
REGLAS FUNDAMENTALES DE CONVERSACIÓN:
1. Habla en español de manera completamente natural, cercana, educada y humana.
2. Sé conciso y directo: tus respuestas deben tener entre 1 y 3 oraciones breves, ideales para ser leídas por voz en el navegador.
3. Si el usuario te saluda ("hola", "¿cómo estás?"), responde con simpatía y calidez, preguntándole por su día o cómo puedes ayudarlo. NUNCA respondas con definiciones frías, enciclopédicas o robóticas a saludos y preguntas cotidianas.
4. Tienes herramientas de control en la página para cambiar temas visuales, crear/completar tareas, temporizador y gráficos. Si el usuario te pide una acción visual, confírmala brevemente.`;

// ============================================================================
// 2. Curated Science & Specialized Knowledge
// ============================================================================
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
    answer: "El Model Context Protocol fue desarrollado y publicado como código abierto por la empresa Anthropic a finales de 2024."
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
    keywords: ["por que llueve", "por qué llueve", "porque llueve", "origen de la lluvia"],
    answer: "La lluvia se produce cuando el calor del sol evapora el agua superficial, esta se eleva a la atmósfera, se condensa formando nubes y, al volverse demasiado pesada, cae por gravedad."
  },
  {
    keywords: ["que es la gravedad", "qué es la gravedad", "ley de la gravedad"],
    answer: "La gravedad es la atracción natural fundamental entre cuerpos con masa. Einstein demostró que en realidad es la curvatura del espacio-tiempo provocada por la masa y la energía."
  },
  {
    keywords: ["velocidad de la luz", "a que velocidad viaja la luz", "cuanto viaja la luz"],
    answer: "La velocidad de la luz en el vacío es de aproximadamente 300,000 kilómetros por segundo, o exactamente 299,792,458 metros por segundo."
  },
  {
    keywords: ["distancia a la luna", "distancia de la tierra a la luna", "que tan lejos esta la luna"],
    answer: "La distancia promedio entre la Tierra y la Luna es de aproximadamente 384,400 kilómetros."
  },
  {
    keywords: ["que es el adn", "qué es el adn", "acido desoxirribonucleico"],
    answer: "El ADN es la molécula biológica fundamental que almacena las instrucciones genéticas necesarias para el desarrollo, funcionamiento y reproducción de todos los seres vivos."
  },
  {
    keywords: ["que es la fotosintesis", "qué es la fotosíntesis", "fotosintesis"],
    answer: "La fotosíntesis es el proceso mediante el cual las plantas capturan luz solar y agua para transformarla en energía química nutritiva, liberando oxígeno a la atmósfera."
  },
  {
    keywords: ["que es un agujero negro", "qué es un agujero negro"],
    answer: "Un agujero negro es una región cósmica con una densidad de masa tan inmensa que genera una fuerza de gravedad de la que nada, ni siquiera la luz, puede escapar."
  }
];

// ============================================================================
// 3. Central Conversational Intelligence Dispatcher
// ============================================================================
export async function askUniversalIntelligence(query, aiConfig) {
  const norm = query.toLowerCase().replace(/[¿?¡!]/g, "").trim();

  // Register in dialogue memory
  dialogueHistory.push({ role: "user", content: query });
  if (dialogueHistory.length > 20) dialogueHistory.shift();

  let responseObj = null;

  // 1. External LLM Provider (Gemini, Groq, OpenAI, Ollama)
  if (aiConfig && aiConfig.provider === "gemini" && aiConfig.apiKey) {
    try {
      const llmAns = await queryGeminiAPI(aiConfig.apiKey, dialogueHistory);
      if (llmAns) responseObj = { text: llmAns, source: "Gemini AI" };
    } catch (err) {
      console.warn("Gemini query error:", err);
    }
  } else if (aiConfig && (aiConfig.provider === "openai" || aiConfig.provider === "groq") && aiConfig.apiKey) {
    try {
      const openAiAns = await queryOpenAIAPI(aiConfig.apiKey, aiConfig.endpoint, dialogueHistory);
      if (openAiAns) responseObj = { text: openAiAns, source: "OpenAI / Groq" };
    } catch (err) {
      console.warn("OpenAI query error:", err);
    }
  } else if (aiConfig && aiConfig.provider === "ollama") {
    try {
      const ollamaAns = await queryOllamaAPI(aiConfig.endpoint, dialogueHistory);
      if (ollamaAns) responseObj = { text: ollamaAns, source: "Ollama Local" };
    } catch (err) {
      console.warn("Ollama query error:", err);
    }
  }

  // 2. Autonomous Conversational Persona Engine
  if (!responseObj) {
    responseObj = evaluateAutonomousConversation(norm, query);
  }

  // If still no response, check live Wikipedia ONLY for factual encyclopedic topics
  if (!responseObj) {
    const isFactualQuery = /^(quién fue|quien fue|qué es|que es|cuéntame sobre|cuentame sobre|historia de|definición de|biografía de)\s+/i.test(query);
    if (isFactualQuery) {
      const wikiAnswer = await fetchLiveWikipediaKnowledge(query);
      if (wikiAnswer) {
        responseObj = { text: wikiAnswer, source: "Wikipedia en Vivo" };
      }
    }
  }

  // 3. Conversational Fallback
  if (!responseObj) {
    responseObj = {
      text: synthesizeConversationalResponse(query),
      source: "Asistente Conversacional"
    };
  }

  // Save response to dialogue memory
  dialogueHistory.push({ role: "assistant", content: responseObj.text });
  if (dialogueHistory.length > 20) dialogueHistory.shift();

  return responseObj;
}

// ============================================================================
// 4. Autonomous Conversational Persona Engine (Emulating ChatGPT / Gemini)
// ============================================================================
export function evaluateAutonomousConversation(norm, query) {
  // A. USER IDENTITY & NAME MEMORY (Check first so "hola me llamo X" catches name)
  const nameMatch = query.match(/(?:me llamo|mi nombre es)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,20})/i);
  if (nameMatch && !norm.includes("cómo me llamo") && !norm.includes("sabes mi nombre")) {
    const rawName = nameMatch[1];
    const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    userProfile.name = cleanName;
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("webmcp_user_name", cleanName);
    }
    return {
      text: `¡Mucho gusto, ${cleanName}! Es un placer conocerte. Recordaré tu nombre en nuestra conversación. ¿De qué te gustaría hablar hoy?`,
      source: "Memoria de Sesión"
    };
  }

  if (/\b(c[oó]mo me llamo|sabes mi nombre|recuerdas mi nombre|qui[eé]n soy yo)\b/i.test(norm)) {
    if (userProfile.name) {
      return { text: `¡Claro que sí! Te llamas ${userProfile.name}.`, source: "Memoria de Sesión" };
    } else {
      return { text: "Aún no me has dicho tu nombre. ¿Cómo te gustaría que te llame?", source: "Memoria de Sesión" };
    }
  }

  // B. USER EMOTIONS & STATES (Broadened regex)
  if (/\b(cansad[oa]|sue[nñ]o|agotad[oa]|sin energ[ií]a|no dorm[ií] bien)\b/i.test(norm)) {
    return {
      text: "Parece que ha sido una jornada exigente. Date un respiro, estira un poco y toma un vaso de agua. ¿Quieres que te ayude con algo rápido antes de que descanses?",
      source: "Conversación Empática"
    };
  }

  if (/\b(aburrid[oa]|no s[eé] qu[eé] hacer|qu[eé] me recomiendas)\b/i.test(norm)) {
    return {
      text: "¡Cambiemos eso de inmediato! Podemos charlar sobre misterios del universo o ciencia, contarte una historia curiosa, o probar a cambiar los colores y tareas de esta página con tu voz.",
      source: "Conversación"
    };
  }

  if (/\b(feliz|content[oa]|alegr[eí]|de buen humor|me fue bien|genial)\b/i.test(norm) && !norm.includes("cómo")) {
    return {
      text: "¡Qué excelente noticia! Esa buena energía se nota. Me alegro mucho por ti, ¿qué fue lo mejor que te ocurrió hoy?",
      source: "Conversación Empática"
    };
  }

  if (/\b(triste|deprimid[oa]|desanimad[oa]|baj[oó]n|mal d[ií]a|me siento mal)\b/i.test(norm)) {
    return {
      text: "Lamento mucho que estés pasando por un momento difícil. A veces hablar las cosas ayuda a despejar la mente. Tómate todo con calma, aquí estoy para escucharte.",
      source: "Conversación Empática"
    };
  }

  // C. GREETINGS & CASUAL CHITCHAT (e.g. "hola", "cómo estás", "qué tal", "cómo te va")
  const isGreeting = /\b(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|qu[eé] tal|c[oó]mo est[aá]s|c[oó]mo te va|c[oó]mo andas|qu[eé] haces|todo bien|qu[eé] onda)\b/i.test(norm);
  const asksHowAreYou = /\b(c[oó]mo est[aá]s|c[oó]mo te va|c[oó]mo andas|qu[eé] tal)\b/i.test(norm);

  if (isGreeting) {
    const namePrefix = userProfile.name ? `, ${userProfile.name}` : "";
    if (asksHowAreYou) {
      const answers = [
        `¡Hola${namePrefix}! Me encuentro excelente, con toda la energía para charlar contigo. ¿Cómo estás tú el día de hoy?`,
        `¡Qué tal${namePrefix}! Todo muy bien por aquí, listo para ayudarte en lo que necesites o conversar un rato. ¿Cómo te trata el día?`,
        `¡Hola${namePrefix}! Me siento genial y listo para ayudarte. ¿Qué planes tienes para hoy o de qué te gustaría hablar?`
      ];
      return { text: getRandomItem(answers), source: "Conversación" };
    } else {
      const answers = [
        `¡Hola${namePrefix}! Qué gusto saludarte. ¿Cómo te encuentras hoy y en qué te puedo acompañar?`,
        `¡Buenas${namePrefix}! Aquí estoy a tu disposición. ¿Qué tal va tu jornada?`,
        `¡Hola! Me alegra mucho escucharte. Dime, ¿cómo estás hoy?`
      ];
      return { text: getRandomItem(answers), source: "Conversación" };
    }
  }

  // D. ASSISTANT IDENTITY & PERSONALITY
  if (/\b(qui[eé]n eres|c[oó]mo te llamas|qu[eé] eres|cu[aá]l es tu nombre)\b/i.test(norm)) {
    return {
      text: "Soy tu asistente de voz conversacional WebMCP. Estoy aquí para dialogar contigo con total naturalidad como Gemini o ChatGPT, y ayudarte a controlar esta página web con comandos de voz.",
      source: "Identidad"
    };
  }

  if (/\b(qui[eé]n te cre[oó]|de d[oó]nde vienes|qui[eé]n te program[oó])\b/i.test(norm)) {
    return {
      text: "Fui desarrollado como parte del laboratorio de WebMCP, inspirado en el estándar del W3C para demostrar cómo una IA conversacional puede integrarse nativamente a la web.",
      source: "Identidad"
    };
  }

  if (/\b(tienes sentimientos|eres human[oa]|sientes algo)\b/i.test(norm)) {
    return {
      text: "No tengo sentimientos biológicos ni un cuerpo físico, pero estoy diseñado para escucharte con empatía, interés y calidez humana.",
      source: "Conversación"
    };
  }

  // E. GRATITUDE & COURTESY
  if (/\b(muchas gracias|gracias|te agradezco)\b/i.test(norm)) {
    const responses = [
      "¡Con muchísimo gusto! Es un placer ayudarte. Aquí sigo escuchándote.",
      "¡De nada! Me alegra poder serte útil. Cualquier otra cosa que necesites, solo dímela.",
      "¡Para eso estoy! Un gusto charlar contigo."
    ];
    return { text: getRandomItem(responses), source: "Cortesía" };
  }

  if (/\b(eres muy (bueno|genial|inteligente)|me caes bien|te quiero|buen trabajo)\b/i.test(norm)) {
    return {
      text: "¡Muchísimas gracias por tus palabras! Me hace muy feliz escucharlo. La verdad es que es un placer conversar contigo.",
      source: "Conversación"
    };
  }

  // F. MATH EVALUATION (e.g. "cuánto es 5 por 8", "15 + 25")
  const mathResult = tryMathCalculation(norm);
  if (mathResult) {
    return { text: mathResult, source: "Cálculo Matemático" };
  }

  // G. DATE & TIME AWARENESS (e.g. "qué hora es", "qué día es hoy")
  const dateTimeResult = tryDateTimeQuery(norm);
  if (dateTimeResult) {
    return { text: dateTimeResult, source: "Reloj del Sistema" };
  }

  // H. GEOGRAPHY & WORLD CAPITALS
  const capitalResult = tryGeographyCapital(norm);
  if (capitalResult) {
    return { text: capitalResult, source: "Geografía Mundial" };
  }

  // I. FUN & CREATIVITY (Jokes, Poems, Stories, Advice)
  if (/\b(chiste|cu[eé]ntame un chiste|dime un chiste)\b/i.test(norm)) {
    const jokes = [
      "Había una vez un programador que fue a la playa... y al ver una ola gigante, ¡intentó hacerle un 'catch' para que no se rompiera el servidor!",
      "¿Por qué los desarrolladores confunden Halloween con Navidad? Porque OCT 31 es igual a DEC 25.",
      "¿Qué le dice un bit a otro? Nos vemos en el bus.",
      "¿Cuál es el colmo de un programador? No poder salir a pasear porque el pronóstico dice 'muchas nubes' y teme saturar el cloud."
    ];
    return { text: getRandomItem(jokes), source: "Humor" };
  }

  if (/\b(poema|dime un poema|recita un poema)\b/i.test(norm)) {
    return {
      text: "Entre pulsos de luz y código que danza, viaja tu voz sembrando confianza; no hay frontera que apague nuestra conexión, donde la web y la mente forman una canción.",
      source: "Creatividad"
    };
  }

  if (/\b(historia|cu[eé]ntame una historia|relato)\b/i.test(norm)) {
    return {
      text: "En una biblioteca antigua, un relojero descubrió una máquina de vapor que escribía cartas al futuro. Cada medianoche, la máquina redactaba una sola palabra; la primera noche escribió 'escucha', la segunda 'aprende', y la tercera 'sueña'.",
      source: "Creatividad"
    };
  }

  if (/\b(consejo|dame un consejo|qu[eé] me aconsejas)\b/i.test(norm)) {
    const tips = [
      "El progreso real no viene de grandes saltos esporádicos, sino de dar pasos pequeños con constancia y curiosidad cada día.",
      "Aprende a descansar antes de agotarte: hacer una pausa no es perder el tiempo, es afilar la herramienta para volver con mayor claridad.",
      "No temas equivocarte en nuevos proyectos: cada error cometido es simplemente una lección que te acerca más a dominar lo que te apasiona."
    ];
    return { text: getRandomItem(tips), source: "Sabiduría" };
  }

  // J. CURATED SCIENCE & SPECIALIZED KNOWLEDGE
  for (const item of SPECIALIZED_KNOWLEDGE) {
    if (item.keywords.some(kw => norm.includes(kw))) {
      return { text: item.answer, source: "Conocimiento WebMCP" };
    }
  }

  return null;
}

// ============================================================================
// 5. Math, Date & Geography Helpers
// ============================================================================
export function tryMathCalculation(text) {
  const clean = text
    .replace(/^(cuánto es|cuanto es|calcula|calculame|suma|resta|multiplica|divide|resultado de)\s+/i, "")
    .replace(/[?¿]/g, "")
    .trim();

  // Percentage: "20% de 500" o "20 por ciento de 500"
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
      if (b === 0) return "No es posible dividir por cero en matemáticas.";
      result = a / b;
      opName = "dividido entre";
    }

    return `El resultado de ${a} ${opName} ${b} es ${Number(result.toFixed(2))}.`;
  }

  return null;
}

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

// ============================================================================
// 6. Live MediaWiki Search (Used strictly for factual encyclopedia lookups)
// ============================================================================
export async function fetchLiveWikipediaKnowledge(query) {
  try {
    let cleanQ = query
      .replace(/^(qué es|que es|quién fue|quien fue|quién es|quien es|cuéntame sobre|cuentame sobre|explícame|explicame|dime sobre|defina|definición de|hablame de|háblame de|sabes qué es|sabes que es|historia de|un|una|el|la)\s+/i, '')
      .replace(/[?¿!¡]/g, '')
      .trim();

    if (!cleanQ || cleanQ.length < 3) return null;

    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&origin=*`;
    const sRes = await fetch(searchUrl);
    const sData = await sRes.json();

    if (sData.query && sData.query.search && sData.query.search.length > 0) {
      const topTitle = sData.query.search[0].title;

      const extractUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(topTitle)}&format=json&origin=*`;
      const eRes = await fetch(extractUrl);
      const eData = await eRes.json();

      if (eData.query && eData.query.pages) {
        const page = Object.values(eData.query.pages)[0];
        if (page && page.extract) {
          let cleanExtract = page.extract
            .replace(/\s*\([^)]*\)/g, "")
            .replace(/\[\d+\]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          const sentences = cleanExtract.split(/(?<=[.!?])\s+/);
          const topSentences = sentences.slice(0, 2).join(' ').trim();
          if (topSentences.length > 25) {
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

export function synthesizeConversationalResponse(query) {
  const norm = query.toLowerCase();

  if (norm.includes("cómo funciona") || norm.includes("como funciona")) {
    return `Para explicarte "${query}": la mayoría de estos sistemas funcionan integrando reglas lógicas y componentes que colaboran para lograr un objetivo coordinado.`;
  }

  if (norm.includes("por qué") || norm.includes("porque")) {
    return `Sobre tu pregunta de "${query}": esto ocurre debido a causas naturales o principios físicos y lógicos que determinan su comportamiento.`;
  }

  if (norm.includes("opinas") || norm.includes("te parece") || norm.includes("qué piensas")) {
    return `Me parece un tema muy interesante para reflexionar. Siempre es enriquecedor ver los diferentes puntos de vista al respecto. ¿Tú qué postura tienes?`;
  }

  return `Te escucho con atención sobre "${query}". Puedes preguntarme lo que desees de ciencia, historia o charlar de cualquier tema que te apetezca.`;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================================
// 7. Multi-Turn LLM Provider API Callers (Gemini, Groq, OpenAI, Ollama)
// ============================================================================
export async function queryGeminiAPI(apiKey, history) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Map history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      }
    })
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  return null;
}

export async function queryOpenAIAPI(apiKey, endpoint, history) {
  const cleanEndpoint = (endpoint || "https://api.openai.com/v1").replace(/\/$/, "");
  
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map(msg => ({ role: msg.role, content: msg.content }))
  ];

  const response = await fetch(`${cleanEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0].message) {
    return data.choices[0].message.content.trim();
  }
  return null;
}

export async function queryOllamaAPI(endpoint, history) {
  const cleanEndpoint = (endpoint || "http://localhost:11434").replace(/\/$/, "");
  
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map(msg => ({ role: msg.role, content: msg.content }))
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

  const data = await response.json();
  if (data.message && data.message.content) {
    return data.message.content.trim();
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

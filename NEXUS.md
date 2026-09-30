# NEXUS 🚀
## Centro de Mejoras, Roadmap y Registro de Evolución del Asistente

**NEXUS** es el registro centralizado del proyecto para documentar ideas, puntos débiles detectados, tareas pendientes y mejoras planificadas para el asistente de voz y la implementación de WebMCP.

---

## 📌 Estado Actual del Proyecto
- **Especificación WebMCP:** Archivos base del estándar W3C intactos y protegidos según [AGENT_RULES.md](file:///c:/Users/Ramoncito/.antigravity-ide/webmcp/AGENT_RULES.md).
- **Arquitectura Modular (`demo/js/`):**
  - ✅ `webmcp-core.js`: Polyfill estándar de `document.modelContext` y registro de herramientas.
  - ✅ `ai-brain.js`: Cerebro de conocimiento universal (cálculo matemático, reloj del sistema, capitales mundiales, Wikipedia en vivo con redirecciones, explicador conceptual y LLMs externos).
  - ✅ `voice-engine.js`: Full-duplex con *turn-taking*, barge-in, rescate de transcripción en `onend` y prevención de garbage-collector en `SpeechSynthesis`.
  - ✅ `widgets.js`: Gestión de tareas con persistencia en `localStorage`, temporizador y gráfico Canvas.
  - ✅ `ui.js`: Renderizado de chat, trazas de telemetría, inspector de herramientas y modal de configuración.
  - ✅ `app.js`: Orquestador ES6 limpio y desacoplado (sin ciclos de dependencias, verificado por GitNexus).

---

## ⚡ Backlog de Mejoras Prioritarias (Cosas a Mejorar)

### 1. 🎙️ Experiencia de Voz y Audio
- [x] **Corrección de Transcripción Silenciosa:** Rescate de voz acumulada cuando Chrome finaliza el micrófono antes de emitir `isFinal=true`.
- [x] **Prevención de Bloqueo de Voz:** Protección contra el bug de recolección de basura de Chrome en `SpeechSynthesisUtterance`.
- [ ] **Selector de Acentos y Voces en UI:** Menú visual para elegir voces específicas en español (latinoamericano, español de España, tono y velocidad preferida).

### 2. 🛠️ Nuevas Herramientas WebMCP
- [x] **Herramienta de Lectura de Contenido:** Añadida herramienta `leer_contenido_pantalla` para resumir tareas, gráficos o estado general.
- [ ] **Herramienta de Formularios Declarativos:** Implementar la propuesta declarativa HTML (`<form modelcontext ...>`) para que el agente rellene y envíe formularios sin tocar JavaScript.
- [ ] **Control Multimedia:** Añadir herramientas para pausar/reproducir elementos de audio o video en la página web.

### 3. 🧠 Memoria y Contexto Conversacional
- [x] **Memoria de Sesión Persistente:** Guardado automático de tareas, tema y configuración del cerebro en `localStorage`.
- [ ] **Exportación de Historial:** Botón para descargar el log de la conversación y las trazas de ejecución en formato Markdown o JSON.

---

## 📝 Registro de Mejoras Implementadas (Changelog)

| Fecha | Mejora Realizada | Archivos Afectados |
| :--- | :--- | :--- |
| **2026-09-29** | Creación inicial del Voice Studio con WebMCP polyfill | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Corrección de colisión de eventos y `InvalidStateError` | `demo/app.js` |
| **2026-09-29** | Implementación del Modo Conversación Continua Manos Libres (*Turn-taking* automático y chimes) | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Eliminación de respuestas enlatadas; integración de Cerebro Híbrido Autónomo (Wikipedia en vivo + MCP knowledge) y soporte LLM (Gemini/Ollama) | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Creación del sistema de directivas del agente y backlog evolutivo | `AGENT_RULES.md`, `.agents/rules/agent_rules.md`, `NEXUS.md` |
| **2026-09-29** | Refactorización modular integral: separación en `webmcp-core`, `ai-brain`, `voice-engine`, `widgets` y `ui` | `demo/js/*`, `demo/app.js`, `demo/index.html` |
| **2026-09-29** | Corrección de bug de habla ignorada (captura en `onend`) y bug de Chrome GC en síntesis vocal | `demo/js/voice-engine.js` |
| **2026-09-29** | Incorporación de motor universal de respuestas: matemáticas, reloj en tiempo real, capitales del mundo, redirecciones de Wikipedia | `demo/js/ai-brain.js` |
| **2026-09-29** | Generación de Favicon SVG/ICO para eliminar error 404 en consola | `demo/index.html`, `demo/favicon.ico` |
| **2026-09-30** | Transformación en IA Conversacional (estilo ChatGPT/Gemini): memoria multi-turno, respuestas empáticas naturales y eliminación de respuestas enciclopédicas a saludos | `demo/js/ai-brain.js`, `demo/app.js` |

---

## 💡 Cómo usar este archivo
1. Cada vez que detectes algo que no funciona bien o quieras una nueva capacidad, anótalo en la sección **Backlog de Mejoras Prioritarias**.
2. Al completar una mejora, muévela a **Registro de Mejoras Implementadas**.
3. El agente de IA consultará este archivo antes de realizar tareas evolutivas en el proyecto.

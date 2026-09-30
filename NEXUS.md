# NEXUS 🚀
## Centro de Mejoras, Roadmap y Registro de Evolución del Asistente

**NEXUS** es el registro centralizado del proyecto para documentar ideas, puntos débiles detectados, tareas pendientes y mejoras planificadas para el asistente de voz y la implementación de WebMCP.

---

## 📌 Estado Actual del Proyecto
- **Especificación WebMCP:** Archivos base del estándar W3C intactos y protegidos según [AGENT_RULES.md](file:///c:/Users/Ramoncito/.antigravity-ide/webmcp/AGENT_RULES.md).
- **Voice Studio (`demo/`):**
  - ✅ Entrada y salida de voz bidireccional (SpeechRecognition + SpeechSynthesis).
  - ✅ Modo Conversación Continua Manos Libres (*Turn-taking* con reapertura automática y tonos *chime* de turno).
  - ✅ Tolerancia a silencios y protección contra errores de estado `InvalidStateError`.
  - ✅ 5 Herramientas WebMCP funcionales (`cambiar_tema`, `gestionar_tareas`, `controlar_temporizador`, `generar_grafico`, `consultar_herramientas`).
  - ✅ Cerebro Híbrido Autónomo: Responde preguntas abiertas sobre cualquier tema consultando Wikipedia en tiempo real y base de conocimiento especializada.
  - ✅ Soporte para conectar proveedores LLM externos (Google Gemini, Ollama local, OpenAI).

---

## ⚡ Backlog de Mejoras Prioritarias (Cosas a Mejorar)

### 1. 🎙️ Experiencia de Voz y Audio
- [ ] **Voice Activity Detection (VAD) en Web Audio:** Incorporar detección de nivel de decibelios para cortar los silencios finales de forma instantánea sin esperar el timeout del navegador.
- [ ] **Barge-in por Voz (Interrupción hablada):** Permitir que el usuario hable *encima* del asistente para interrumpirlo automáticamente cuando esté hablando, cancelando la síntesis de voz al instante.
- [ ] **Selector de Acentos y Voces:** Añadir un menú visual para seleccionar voces específicas en español (latinoamericano, español de España, tono y velocidad preferida).

### 2. 🛠️ Nuevas Herramientas WebMCP
- [ ] **Herramienta de Formularios Declarativos:** Implementar la propuesta declarativa HTML (`<form modelcontext ...>`) para que el agente rellene y envíe formularios sin tocar JavaScript.
- [ ] **Herramienta de Lectura y Resumen de Contenido:** Crear una herramienta `leer_seccion_pagina` para que el asistente pueda leer y resumir cualquier bloque de texto visible en pantalla.
- [ ] **Control Multimedia:** Añadir herramientas para pausar/reproducir elementos de audio o video en la página web.

### 3. 🧠 Memoria y Contexto Conversacional
- [ ] **Memoria de Sesión Persistente:** Guardar las preferencias del usuario (nombre, temas favoritos, tareas pendientes) en `localStorage` o IndexedDB para recordarlas entre recargas de página.
- [ ] **Exportación de Historial:** Botón para descargar el log de la conversación y las trazas de ejecución en formato Markdown o JSON.

### 4. 🌐 Diagnóstico de Soporte Nativo WebMCP
- [ ] **Detector de Flags del Navegador:** Panel de diagnóstico que compruebe si el navegador actual tiene habilitado el flag nativo de Chromium `about:flags#enable-webmcp-testing` o el Origin Trial activo.

---

## 📝 Registro de Mejoras Implementadas (Changelog)

| Fecha | Mejora Realizada | Archivos Afectados |
| :--- | :--- | :--- |
| **2026-09-29** | Creación inicial del Voice Studio con WebMCP polyfill | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Corrección de colisión de eventos y `InvalidStateError` | `demo/app.js` |
| **2026-09-29** | Implementación del Modo Conversación Continua Manos Libres (*Turn-taking* automático y chimes) | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Eliminación de respuestas enlatadas; integración de Cerebro Híbrido Autónomo (Wikipedia en vivo + MCP knowledge) y soporte LLM (Gemini/Ollama) | `demo/index.html`, `demo/app.js`, `demo/style.css` |
| **2026-09-29** | Creación del sistema de directivas del agente y backlog evolutivo | `AGENT_RULES.md`, `.agents/rules/agent_rules.md`, `NEXUS.md` |

---

## 💡 Cómo usar este archivo
1. Cada vez que detectes algo que no funciona bien o quieras una nueva capacidad, anótalo en la sección **Backlog de Mejoras Prioritarias**.
2. Al completar una mejora, muévela a **Registro de Mejoras Implementadas**.
3. El agente de IA consultará este archivo antes de realizar tareas evolutivas en el proyecto.

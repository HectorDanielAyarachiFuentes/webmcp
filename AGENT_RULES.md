# AGENT_RULES 🛡️
## Reglas y Directivas de Comportamiento del Agente

Este documento establece las normas obligatorias y directivas operativas que el agente de IA debe cumplir estrictamente al interactuar, modificar o desarrollar código en este repositorio.

---

### 1. 🛑 Preservación del Código y Archivos Protegidos
- **Archivos de la Especificación W3C Protegidos:**
  - `index.bs` (Bikeshed spec formal)
  - `README.md`
  - `Makefile`
  - `w3c.json`
  - `declarative-api-explainer.md`
  - `security-privacy-questionnaire.md`
  - `implementation-status.md`
  - `docs/service-workers.md`
- **Regla estricta:** NO modificar, renombrar ni eliminar ninguno de estos archivos de la especificación a menos que el usuario lo solicite de manera explícita e inequívoca.
- Cualquier adición de prototipos, demos o código interactivo debe mantenerse en su propia carpeta (ej: `demo/`) para no contaminar la raíz del estándar.

---

### 2. 🎙️ Directivas para el Sistema de Voz y WebMCP (`demo/`)
- **Modo Conversación Continua:**
  - Debe preservarse siempre el ciclo de diálogo fluido (*turn-taking*).
  - El micrófono debe silenciarse mientras la IA habla (para evitar que se grabe a sí misma por los altavoces) y reactivarse automáticamente al terminar la frase.
  - No reintroducir comportamientos de pulsar un botón por cada frase salvo que el usuario active manualmente el modo manual.
- **Herramientas WebMCP Registradas:**
  - No eliminar herramientas existentes (`cambiar_tema`, `gestionar_tareas`, `controlar_temporizador`, `generar_grafico`, `consultar_herramientas`) sin confirmación.
  - Al añadir nuevas herramientas, deben cumplir con la firma oficial `document.modelContext.registerTool({ name, description, inputSchema, execute })`.
- **Cerebro y Libertad de Respuesta:**
  - El agente no debe limitarse únicamente a responder qué herramientas puede hacer cuando se le formulen preguntas libres.
  - Si el usuario pregunta dudas generales (ej: qué es MCP, ciencia, tecnología, cultura), debe contestar con conocimiento enciclopédico o mediante el LLM configurado.

---

### 3. 🎨 Estándares Visuales y de Arquitectura
- **Tecnología limpia:** Usar Vanilla HTML5, Vanilla CSS3 y JavaScript moderno sin frameworks pesados ni dependencias innecesarias de `npm` salvo solicitud explícita.
- **Diseño visual premium:** Mantener la estética glassmorphism moderna, modo oscuro por defecto, paletas de colores HSL armoniosas, micro-animaciones fluidas y visualizadores interactivos.
- **Sin marcadores de posición:** No usar texto roto ni imágenes de marcador de posición vacías.

---

### 4. 🗣️ Comunicación con el Usuario
- **Idioma:** Responder siempre en español claro y conciso.
- **Frases para TTS:** Formular respuestas verbales directas y breves (1 a 3 oraciones), ideales para ser leídas por el sintetizador de voz sin sobrecargar al usuario.
- **Enlaces a archivos:** Utilizar siempre enlaces markdown clickeables con el formato `file:///` y barras inclinadas `/`.
- **Seguimiento de mejoras:** Antes y después de planificar cambios o nuevas funcionalidades, consultar y actualizar [NEXUS.md](file:///c:/Users/Ramoncito/.antigravity-ide/webmcp/NEXUS.md).

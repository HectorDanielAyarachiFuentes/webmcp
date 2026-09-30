/**
 * WebMCP Core - Polyfill and Tool Registration Engine
 * Complies with the W3C Web Model Context Protocol specification draft.
 */

export function setupWebMCPPolyfill() {
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

  // Alias navigator.modelContext to document.modelContext
  if (!navigator.modelContext) {
    navigator.modelContext = document.modelContext;
  }

  return document.modelContext;
}

/**
 * Registers default WebMCP demo tools on the page
 */
export async function registerDefaultTools({ state, renderTaskList, renderChart, startTimer, stopTimer, resetTimer }) {
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
      const normalized = (tema || "").toLowerCase();
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
      localStorage.setItem("webmcp_theme", selectedTheme);
      const themeSelect = document.getElementById("themeSelect");
      if (themeSelect) themeSelect.value = selectedTheme;

      renderChart();
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
          localStorage.setItem("webmcp_tasks", JSON.stringify(state.tasks));
          renderTaskList();
          return {
            status: "success",
            message: `Tarea agregada: "${newTask.text}"`,
            totalTareas: state.tasks.length
          };

        case "completar":
          let target = state.tasks.find(t => t.id === Number(id));
          if (!target && state.tasks.length > 0) {
            target = state.tasks.find(t => !t.completed) || state.tasks[0];
          }
          if (target) {
            target.completed = true;
            localStorage.setItem("webmcp_tasks", JSON.stringify(state.tasks));
            renderTaskList();
            return { status: "success", message: `Tarea "${target.text}" marcada como completada.` };
          }
          return { status: "not_found", message: "No se encontró la tarea especificada." };

        case "limpiar":
          state.tasks = [];
          localStorage.setItem("webmcp_tasks", JSON.stringify(state.tasks));
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
        state.chart.values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 80) + 30);
      }
      renderChart();
      return {
        status: "success",
        message: `Gráfico "${state.chart.title}" actualizado con ${state.chart.values.length} puntos de datos.`
      };
    }
  });

  // Tool 5: Lectura de Contenido en Pantalla
  await document.modelContext.registerTool({
    name: "leer_contenido_pantalla",
    description: "Lee o resume secciones visibles de la página web actual para el usuario.",
    inputSchema: {
      type: "object",
      properties: {
        seccion: { type: "string", enum: ["tareas", "grafico", "inspector", "general"] }
      }
    },
    execute({ seccion }) {
      if (seccion === "tareas") {
        const pend = state.tasks.filter(t => !t.completed).length;
        return {
          status: "success",
          message: `Tienes ${state.tasks.length} tareas en total, de las cuales ${pend} están pendientes.`
        };
      } else if (seccion === "grafico") {
        const max = Math.max(...state.chart.values);
        return {
          status: "success",
          message: `El gráfico muestra ${state.chart.title} con un valor máximo de ${max}.`
        };
      }
      return {
        status: "success",
        message: "Estás en el WebMCP Voice Studio con herramientas interactivas y agente de voz conectado."
      };
    }
  });

  // Tool 6: Consultar Herramientas Registradas
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
}

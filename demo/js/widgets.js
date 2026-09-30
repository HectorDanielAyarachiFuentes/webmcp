/**
 * Widgets Module - Task Board, Smart Timer & Dynamic Canvas Chart
 * Encapsulates DOM and Canvas rendering for live page controls.
 */

export function renderTaskList(state) {
  const listEl = document.getElementById("taskList");
  const badgeEl = document.getElementById("taskCountBadge");
  if (!listEl) return;

  listEl.innerHTML = "";
  if (badgeEl) badgeEl.textContent = `${state.tasks.length} tarea${state.tasks.length === 1 ? '' : 's'}`;

  // Persist tasks in localStorage
  try {
    localStorage.setItem("webmcp_tasks", JSON.stringify(state.tasks));
  } catch (e) {}

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

  // Attach event handlers
  listEl.querySelectorAll(".task-checkbox").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      const t = state.tasks.find(x => x.id === id);
      if (t) {
        t.completed = e.target.checked;
        renderTaskList(state);
      }
    });
  });

  listEl.querySelectorAll(".task-del-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      state.tasks = state.tasks.filter(x => x.id !== id);
      renderTaskList(state);
    });
  });
}

export function loadSavedTasks() {
  try {
    const saved = localStorage.getItem("webmcp_tasks");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [
    { id: 1, text: "Explorar la propuesta de especificación WebMCP", completed: true },
    { id: 2, text: "Hablar por voz en modo manos libres con el navegador", completed: false },
    { id: 3, text: "Preguntar '¿Qué es MCP y qué diferencia tiene con WebMCP?'", completed: false }
  ];
}

export function startTimer(seconds, state, callbacks = {}) {
  stopTimer(state);
  state.timer.remainingSeconds = seconds;
  state.timer.isRunning = true;

  updateTimerDisplay(state);
  const badge = document.getElementById("timerStatusBadge");
  if (badge) {
    badge.textContent = "En marcha";
    badge.className = "badge timer-badge active";
  }
  const stopBtn = document.getElementById("timerStopBtn");
  if (stopBtn) stopBtn.disabled = false;

  state.timer.intervalId = setInterval(() => {
    state.timer.remainingSeconds--;
    updateTimerDisplay(state);

    if (state.timer.remainingSeconds <= 0) {
      stopTimer(state);
      const alertMsg = "¡Tiempo cumplido en el temporizador!";
      if (callbacks.appendChatMessage) callbacks.appendChatMessage(alertMsg, "agent");
      if (callbacks.speakResponse) callbacks.speakResponse(alertMsg);
      if (callbacks.playBeep) callbacks.playBeep();
    }
  }, 1000);
}

export function stopTimer(state) {
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

export function resetTimer(state) {
  stopTimer(state);
  state.timer.remainingSeconds = 0;
  updateTimerDisplay(state);
  const badge = document.getElementById("timerStatusBadge");
  if (badge) {
    badge.textContent = "Inactivo";
    badge.className = "badge timer-badge";
  }
}

export function updateTimerDisplay(state) {
  const display = document.getElementById("timerDisplay");
  if (!display) return;
  const m = Math.floor(state.timer.remainingSeconds / 60).toString().padStart(2, '0');
  const s = (state.timer.remainingSeconds % 60).toString().padStart(2, '0');
  display.textContent = `${m}:${s}`;
}

export function renderChart(state) {
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
    const step = chartW / Math.max(count - 1, 1);
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

export function roundRect(ctx, x, y, width, height, radius) {
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

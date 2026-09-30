/**
 * Voice Engine - Full-Duplex SpeechRecognition, SpeechSynthesis & VAD
 * Manages audio chimes, hands-free turn-taking, barge-in, and visualizer.
 */

let recognition = null;
let isRecognitionStarting = false;
let audioContext = null;
let analyser = null;
let micStream = null;
let vadInterval = null;

export function initSpeechSynthesis(state) {
  if (!('speechSynthesis' in window)) return;

  function loadVoices() {
    state.availableVoices = window.speechSynthesis.getVoices();
  }

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function playTurnChime() {
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

export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

export function speakResponse(text, state, callbacks) {
  const { updateConversationUI, setAgentState, addTrace } = callbacks;

  if (!state.ttsEnabled || !('speechSynthesis' in window)) {
    if (state.continuousMode && state.conversationActive) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (!state.isSpeaking && state.continuousMode && state.conversationActive) {
          playTurnChime();
          startListening(state, callbacks);
        }
      }, 500);
    }
    return;
  }

  // Ensure speech synthesis is active and not paused in Chrome
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
  } catch (e) {}

  stopListening(state, callbacks);

  // Always refresh voices if empty
  if (!state.availableVoices || state.availableVoices.length === 0) {
    state.availableVoices = window.speechSynthesis.getVoices();
  }

  // Strip markdown characters so TTS doesn't say "asterisco", "hashtag", etc.
  const cleanSpeechText = (text || "")
    .replace(/[*#_`~]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
  // CRITICAL: Store in persistent reference to prevent Chrome GC bug
  window._activeSpeechUtterance = utterance;

  utterance.rate = state.voiceRate || 1.05;
  utterance.pitch = 1.0;

  // Selected or natural Spanish voice
  const esVoice = state.availableVoices.find(v => v.lang.startsWith("es") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft") || v.name.includes("Sabina") || v.name.includes("Jorge") || v.name.includes("Helena") || v.name.includes("Laura") || v.name.includes("Pablo"))) ||
                  state.availableVoices.find(v => v.lang.startsWith("es"));

  if (esVoice) {
    utterance.voice = esVoice;
  } else {
    utterance.lang = "es-ES";
  }

  let finished = false;
  const onDone = () => {
    if (finished) return;
    finished = true;
    window._activeSpeechUtterance = null;
    state.isSpeaking = false;
    updateConversationUI();
    setAgentState("Listo para escucharte", false);

    // Turn-taking loop: automatically restart listening after speaking finishes
    if (state.continuousMode && state.conversationActive) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (!state.isSpeaking && state.continuousMode && state.conversationActive) {
          playTurnChime();
          startListening(state, callbacks);
        }
      }, 350);
    }
  };

  utterance.onstart = () => {
    state.isSpeaking = true;
    updateConversationUI();
    setAgentState("Respondiendo con voz...", true);
    addTrace("TTS_SPEAK", "Generando síntesis de voz", "response");
  };

  utterance.onend = onDone;
  utterance.onerror = (err) => {
    console.warn("SpeechSynthesis notice/error:", err);
    onDone();
  };

  // Chrome 15s watchdog failsafe in case onend doesn't trigger
  setTimeout(() => {
    if (state.isSpeaking && !finished) {
      console.warn("SpeechSynthesis watchdog timeout");
      onDone();
    }
  }, Math.max(7000, text.length * 100));

  window.speechSynthesis.speak(utterance);
}

export function initSpeechRecognition(state, callbacks) {
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
    recognition.continuous = false;
    recognition.interimResults = true;

    let lastRecordedTranscript = "";
    let hasHandledInstruction = false;

    recognition.onstart = () => {
      isRecognitionStarting = false;
      state.isListening = true;
      lastRecordedTranscript = "";
      hasHandledInstruction = false;
      callbacks.updateConversationUI();
      const transcript = document.getElementById("transcriptLive");
      if (transcript) transcript.textContent = "Te escucho... habla libremente";
      callbacks.setAgentState("Escuchando...", true);
    };

    recognition.onresult = (event) => {
      // Barge-in: if assistant was still speaking, immediately cut off speech
      if (state.isSpeaking) {
        window.speechSynthesis.cancel();
        state.isSpeaking = false;
      }

      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const spoken = (finalTranscript || interim || "").trim();
      if (spoken) {
        lastRecordedTranscript = spoken;
      }

      const transcriptEl = document.getElementById("transcriptLive");
      if (transcriptEl) {
        transcriptEl.textContent = spoken || "Escuchando...";
      }

      // If speech recognition engine marked a final result:
      if (finalTranscript && finalTranscript.trim() && !hasHandledInstruction) {
        hasHandledInstruction = true;
        stopListening(state, callbacks);
        if (state.continuousMode) {
          state.conversationActive = true;
        }
        callbacks.onUserInstruction(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      isRecognitionStarting = false;
      state.isListening = false;
      callbacks.updateConversationUI();

      if (event.error === 'no-speech') {
        if (state.continuousMode && state.conversationActive && !state.isSpeaking) {
          const transcriptEl = document.getElementById("transcriptLive");
          if (transcriptEl) transcriptEl.textContent = "Esperando tu voz... (habla cuando quieras)";
          clearTimeout(state.relistenTimeout);
          state.relistenTimeout = setTimeout(() => {
            if (state.continuousMode && state.conversationActive && !state.isSpeaking && !state.isListening) {
              startListening(state, callbacks);
            }
          }, 300);
          return;
        }
      } else if (event.error === 'not-allowed') {
        const transcriptEl = document.getElementById("transcriptLive");
        if (transcriptEl) transcriptEl.textContent = "Permiso de micrófono denegado. Permite el acceso para hablar.";
        pauseConversation(state, callbacks);
      } else {
        const transcriptEl = document.getElementById("transcriptLive");
        if (transcriptEl) transcriptEl.textContent = `Voz en espera (${event.error}).`;
      }
    };

    recognition.onend = () => {
      isRecognitionStarting = false;
      state.isListening = false;
      callbacks.updateConversationUI();

      // CRITICAL FIX: If user spoke but Chrome ended recognition before marking isFinal=true, dispatch it now!
      if (!hasHandledInstruction && lastRecordedTranscript && lastRecordedTranscript.trim().length > 1) {
        hasHandledInstruction = true;
        if (state.continuousMode) {
          state.conversationActive = true;
        }
        callbacks.onUserInstruction(lastRecordedTranscript.trim());
        return;
      }

      if (state.continuousMode && state.conversationActive && !state.isSpeaking) {
        clearTimeout(state.relistenTimeout);
        state.relistenTimeout = setTimeout(() => {
          if (state.continuousMode && state.conversationActive && !state.isSpeaking && !state.isListening) {
            startListening(state, callbacks);
          }
        }, 250);
      }
    };
  } catch (err) {
    console.error("Error initializing SpeechRecognition:", err);
  }
}

export function startListening(state, callbacks) {
  if (state.isListening || isRecognitionStarting || state.isSpeaking) return;

  if (!recognition) {
    initSpeechRecognition(state, callbacks);
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
        if (state.conversationActive && !state.isSpeaking) startListening(state, callbacks);
      }, 300);
    }
  }
}

export function stopListening(state, callbacks) {
  isRecognitionStarting = false;
  state.isListening = false;
  if (recognition) {
    try { recognition.abort(); } catch (err) {}
  }
  callbacks.updateConversationUI();
}

export function startConversation(state, callbacks) {
  state.conversationActive = true;
  callbacks.updateConversationUI();
  playTurnChime();
  startListening(state, callbacks);
  callbacks.addTrace("CONVERSATION", "Modo conversación continua activado", "init");
}

export function pauseConversation(state, callbacks) {
  state.conversationActive = false;
  clearTimeout(state.relistenTimeout);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopListening(state, callbacks);
  callbacks.updateConversationUI();
  callbacks.addTrace("CONVERSATION", "Modo conversación pausado", "init");
}

export function toggleConversation(state, callbacks) {
  if (state.conversationActive) {
    pauseConversation(state, callbacks);
  } else {
    startConversation(state, callbacks);
  }
}

export function initAudioVisualizer(state) {
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

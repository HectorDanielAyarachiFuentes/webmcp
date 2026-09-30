/**
 * Voice Engine - Full-Duplex SpeechRecognition, SpeechSynthesis & VAD
 * Manages audio chimes, hands-free turn-taking, barge-in, and visualizer.
 */

let recognition = null;
let isRecognitionStarting = false;

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

  // Chrome watchdog failsafe in case onend doesn't trigger
  setTimeout(() => {
    if (state.isSpeaking && !finished) {
      console.warn("SpeechSynthesis watchdog timeout");
      onDone();
    }
  }, Math.max(7000, text.length * 100));

  window.speechSynthesis.speak(utterance);
}

function createRecognitionInstance(state, callbacks, initialTranscript = "") {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  if (recognition) {
    try {
      recognition.onstart = null;
      recognition.onspeechstart = null;
      recognition.onspeechend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    } catch (e) {}
    recognition = null;
  }

  const rec = new SpeechRecognition();
  rec.lang = state.voiceLang || "es-AR";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let accumulatedTranscript = initialTranscript || "";
  let hasHandledInstruction = false;
  let turnDebounceTimer = null;

  function commitTurn() {
    clearTimeout(turnDebounceTimer);
    turnDebounceTimer = null;
    if (hasHandledInstruction) return;

    const sentence = accumulatedTranscript.trim();
    if (sentence.length >= 2) {
      hasHandledInstruction = true;
      accumulatedTranscript = "";
      state.userIsSpeakingNow = false;
      stopListening(state, callbacks);
      if (state.continuousMode) {
        state.conversationActive = true;
      }
      callbacks.onUserInstruction(sentence);
    }
  }

  rec.onstart = () => {
    isRecognitionStarting = false;
    state.isListening = true;
    callbacks.updateConversationUI();
    const transcript = document.getElementById("transcriptLive");
    if (transcript && !accumulatedTranscript) {
      transcript.textContent = "Te escucho... habla libremente";
    } else if (transcript && accumulatedTranscript) {
      transcript.textContent = accumulatedTranscript;
    }
    callbacks.setAgentState(accumulatedTranscript ? `Escuchando: "${accumulatedTranscript}"` : "Escuchando...", true);
    callbacks.addTrace("VOICE_EVENT", `Reconocimiento iniciado en idioma: ${rec.lang}`, "voice");
  };

  rec.onspeechstart = () => {
    state.userIsSpeakingNow = true;
    callbacks.setAgentState("Detectando tu voz...", true);
    callbacks.addTrace("VOICE_EVENT", "Detectó sonido de voz en el micrófono", "voice");
  };

  rec.onspeechend = () => {
    state.userIsSpeakingNow = false;
  };

  rec.onresult = (event) => {
    // Barge-in: if assistant was still speaking, immediately cut off speech
    if (state.isSpeaking) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      state.isSpeaking = false;
    }

    let interim = "";
    let finalChunk = "";

    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalChunk += event.results[i][0].transcript + " ";
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    let currentDisplay = accumulatedTranscript;
    if (finalChunk.trim()) {
      accumulatedTranscript = (accumulatedTranscript + " " + finalChunk).trim();
      currentDisplay = accumulatedTranscript;
    } else if (interim.trim()) {
      currentDisplay = (accumulatedTranscript + " " + interim).trim();
    }

    if (currentDisplay) {
      state.userIsSpeakingNow = true;
      const transcriptEl = document.getElementById("transcriptLive");
      if (transcriptEl) {
        transcriptEl.textContent = currentDisplay;
      }
      callbacks.setAgentState(`Escuchando: "${currentDisplay}"`, true);
      callbacks.addTrace("VOICE_TEXT", `Detectado: "${currentDisplay}"`, "voice");

      // Conversational turn-taking pause (1200ms of silence):
      clearTimeout(turnDebounceTimer);
      turnDebounceTimer = setTimeout(() => {
        state.userIsSpeakingNow = false;
        commitTurn();
      }, 1200);
    }
  };

  rec.onerror = (event) => {
    isRecognitionStarting = false;
    state.userIsSpeakingNow = false;
    callbacks.addTrace("VOICE_ERROR", `Error de reconocimiento: ${event.error}`, "voice");

    const transcriptEl = document.getElementById("transcriptLive");

    if (event.error === 'no-speech') {
      if (state.continuousMode && state.conversationActive && !state.isSpeaking && !accumulatedTranscript) {
        if (transcriptEl && (!transcriptEl.textContent || transcriptEl.textContent.includes("Escuchando") || transcriptEl.textContent.includes("Detectando"))) {
          transcriptEl.textContent = "Esperando tu voz... (habla cerca del micrófono)";
        }
      }
      return;
    }

    if (event.error === 'network') {
      if (transcriptEl) {
        transcriptEl.textContent = "⚠️ Error de red con Google Speech (network). Si usas Brave o bloqueo de privacidad, permite los servicios de voz de Google.";
      }
      return;
    }

    if (event.error === 'audio-capture') {
      if (transcriptEl) {
        transcriptEl.textContent = "⚠️ No se detecta audio del micrófono. Revisa que el micrófono no esté en silencio en Windows.";
      }
      return;
    }

    if (event.error === 'language-not-supported') {
      console.warn("Dialecto no soportado, probando es-ES");
      state.voiceLang = "es-ES";
      const sel = document.getElementById("voiceLangSelect");
      if (sel) sel.value = "es-ES";
      return;
    }

    if (event.error === 'not-allowed') {
      if (transcriptEl) transcriptEl.textContent = "⚠️ Permiso de micrófono bloqueado. Haz clic en el candado en la barra de direcciones y permite el micrófono.";
      pauseConversation(state, callbacks);
      return;
    }

    if (event.error === 'aborted') {
      return;
    }

    console.warn("Speech recognition notice/error:", event.error);
    if (transcriptEl) transcriptEl.textContent = `Aviso de voz (${event.error}).`;
  };

  rec.onend = () => {
    isRecognitionStarting = false;
    state.userIsSpeakingNow = false;

    if (hasHandledInstruction) {
      state.isListening = false;
      callbacks.updateConversationUI();
      return;
    }

    // If turnDebounceTimer is active, the user spoke and may be pausing between words.
    // Seamlessly restart with a FRESH instance passing the accumulated transcript so far!
    if (turnDebounceTimer && state.conversationActive && !state.isSpeaking) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (state.conversationActive && !state.isSpeaking && !hasHandledInstruction) {
          startListening(state, callbacks, accumulatedTranscript);
        }
      }, 50);
      return;
    }

    // If idle and conversation is active, keep listening with a fresh instance
    if (!accumulatedTranscript && state.continuousMode && state.conversationActive && !state.isSpeaking) {
      clearTimeout(state.relistenTimeout);
      state.relistenTimeout = setTimeout(() => {
        if (state.continuousMode && state.conversationActive && !state.isSpeaking && !state.isListening) {
          startListening(state, callbacks);
        }
      }, 200);
      return;
    }

    if (accumulatedTranscript && !turnDebounceTimer) {
      commitTurn();
      return;
    }

    state.isListening = false;
    callbacks.updateConversationUI();
  };

  return rec;
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
}

export function startListening(state, callbacks, initialTranscript = "") {
  if (state.isSpeaking) return;

  if (recognition) {
    try {
      recognition.onstart = null;
      recognition.onspeechstart = null;
      recognition.onspeechend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    } catch (e) {}
    recognition = null;
  }

  recognition = createRecognitionInstance(state, callbacks, initialTranscript);
  if (!recognition) {
    const banner = document.getElementById("transcriptLive");
    if (banner) banner.textContent = "Reconocimiento de voz no soportado en este navegador. Usa el teclado.";
    return;
  }

  try {
    isRecognitionStarting = true;
    recognition.start();

    // Watchdog to prevent isRecognitionStarting from getting stuck
    setTimeout(() => {
      if (isRecognitionStarting && !state.isListening) {
        isRecognitionStarting = false;
      }
    }, 2500);
  } catch (e) {
    isRecognitionStarting = false;
    console.warn("Error starting speech recognition:", e);
    if (e.name === 'InvalidStateError') {
      try { recognition.abort(); } catch (err) {}
      setTimeout(() => {
        if (state.conversationActive && !state.isSpeaking) startListening(state, callbacks, initialTranscript);
      }, 300);
    }
  }
}

export function stopListening(state, callbacks) {
  isRecognitionStarting = false;
  state.isListening = false;
  state.userIsSpeakingNow = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (err) {
      try { recognition.abort(); } catch (e) {}
    }
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
  state.userIsSpeakingNow = false;
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
    phase += active ? (state.userIsSpeakingNow ? 0.22 : 0.12) : 0.03;

    const bars = 36;
    const barWidth = width / bars - 4;

    for (let i = 0; i < bars; i++) {
      let amp = 0.12;

      if (state.userIsSpeakingNow) {
        // High energetic pulse when user is speaking
        amp = 0.45 + 0.5 * Math.sin(phase * 1.8 + i * 0.45) * Math.cos(phase + i * 0.3);
      } else if (state.isListening) {
        // Active listening rhythm
        amp = 0.25 + 0.25 * Math.sin(phase + i * 0.4) * Math.cos(phase * 0.5);
      } else if (state.isSpeaking) {
        // Assistant speaking voice wave
        amp = 0.5 + 0.45 * Math.sin(phase * 1.5 + i * 0.3);
      } else {
        // Idle gentle breathing wave
        amp = 0.08 + 0.06 * Math.sin(phase + i * 0.2);
      }

      amp = Math.max(0.08, Math.min(1.0, Math.abs(amp)));
      const barH = amp * (height - 16);
      const x = i * (barWidth + 4) + 2;
      const y = (height - barH) / 2;

      let color1 = "#6366f1";
      let color2 = "#a855f7";
      if (state.userIsSpeakingNow) {
        color1 = "#10b981"; // Emerald green when actively hearing user's voice
        color2 = "#06b6d4"; // Cyan
      } else if (state.isListening) {
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

// Text-to-speech using the browser's built-in voices (Web Speech API).
// Converted from storyteller-s-library. The Lovable AI voice was removed
// because it needs a server. Order we try:
//   1. a Nepali voice
//   2. a Hindi / Marathi / Bengali voice (same Devanagari script, close enough)
//   3. read the English fallback text aloud
//   4. tell the page that sound is unavailable

let cachedVoices = [];

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function loadVoices() {
  if (!speechSupported()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) {
    cachedVoices = now;
    return Promise.resolve(now);
  }
  // Some browsers load voices a moment after the page opens.
  return new Promise((resolve) => {
    const done = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    window.setTimeout(done, 1200);
  });
}

function pickVoice(lang, voices) {
  const wanted = lang.toLowerCase();
  const order = wanted.startsWith("ne") ? ["ne", "hi", "mr", "bn"] : [wanted.slice(0, 2), "en"];
  for (const prefix of order) {
    const match = voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
    if (match) return match;
  }
  return null;
}

// Some phrases contain a blank for the learner to fill, written as "___"
// (for example "मेरो नाम ___ हो।"). Speech engines read that as
// "underscore underscore underscore", so the blank is turned into a short
// pause before anything is spoken. Screens still show the blank.
export function forSpeech(text) {
  return String(text ?? "")
    .replace(/_{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?।॥])/g, "$1") // no floating full stop where the blank was
    .trim();
}

export async function speak(text, options = {}) {
  const { lang = "ne-NP", rate = 0.9, onStart, onEnd, onUnavailable } = options;
  text = forSpeech(text);
  if (!speechSupported() || !text.trim()) {
    onUnavailable?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = await loadVoices();
  const voice = pickVoice(lang, voices);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? lang;
  if (voice) utterance.voice = voice;
  utterance.rate = rate;

  let started = false;
  utterance.onstart = () => {
    started = true;
    onStart?.();
  };
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    onEnd?.();
    if (!started) onUnavailable?.();
  };
  if (synth.paused) synth.resume();
  synth.speak(utterance);
  window.setTimeout(() => {
    if (!started && !synth.speaking) onUnavailable?.();
  }, 1500);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

// Is there a voice for this language on this device?
// Nepali also accepts Hindi / Marathi / Bengali voices (same script).
async function hasVoiceFor(lang = "ne-NP") {
  const voices = await loadVoices();
  const prefixes = lang.toLowerCase().startsWith("ne") ? ["ne", "hi", "mr", "bn"] : [lang.slice(0, 2).toLowerCase()];
  return voices.some((v) => prefixes.some((p) => v.lang.toLowerCase().replace("_", "-").startsWith(p)));
}

// Say a word in the lesson's language (options.lang, default Nepali).
// Falls back to English if the device has no voice for that language.
export async function speakWord(text, options = {}) {
  const { englishFallback, ...rest } = options;
  text = forSpeech(text);
  if (!text.trim()) {
    rest.onUnavailable?.();
    return;
  }
  stopSpeaking();
  if (await hasVoiceFor(rest.lang)) {
    await speak(text, rest);
    return;
  }
  if (englishFallback) {
    await speak(englishFallback, { ...rest, lang: "en-US" });
    return;
  }
  rest.onUnavailable?.();
}

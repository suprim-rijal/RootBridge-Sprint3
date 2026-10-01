// =====================================================================
// Strict pronunciation grading.
// ---------------------------------------------------------------------
// The browser's speech recognition turns the learner's voice into text
// (plus a few alternative guesses with confidence scores). We never get
// the audio. This service decides how close that was to the target:
//
//   1. Ask Google Gemini with a strict, JSON-only prompt (below).
//   2. If there is no key, the call fails, returns nonsense, or takes
//      more than 4 seconds: use a stricter-than-Sprint-2 local check.
//
// Four verdicts:
//   spot_on     accurate            -> counts as right
//   close       nearly              -> keep trying, costs NO heart
//   needs_work  a real mistake      -> wrong (costs a heart for Normal users)
//   unclear     not enough evidence -> wrong, but said honestly
// =====================================================================
const { env } = require("../config/env");

const VERDICTS = ["spot_on", "close", "needs_work", "unclear"];
const LANGUAGE_NAMES = { nepali: "Nepali", finnish: "Finnish", japanese: "Japanese", twi: "Twi (Akan)" };
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 4000;

// The system prompt from the Sprint 3 plan (strict, one tip, JSON only).
function systemPrompt(language) {
  return `You are a strict, expert pronunciation coach for learners of ${LANGUAGE_NAMES[language] || language}. You are grading a
single spoken attempt at one target word or short phrase, using only:
  (a) the on-device speech recognizer's best transcript and its alternates with confidence scores, and
  (b) the target word's native spelling, its romanization, and its meaning.
You do not have the audio itself, so reason carefully from the transcript evidence: a learner who is
pronouncing correctly will usually produce a transcript that is an exact or near-exact string match to the
target (or to its romanization) with reasonably high recognizer confidence; a learner who mispronounces a
specific sound will usually produce a transcript containing a real, different word or a phonetically similar
but distinct substitution — treat that as a genuine error, not noise. Be strict: do NOT award "spot_on" for a
transcript that is merely "close enough" by edit distance; only award it when the evidence is consistent with
an accurate pronunciation. When you are uncertain because the transcripts disagree with each other or
confidence is low, say so honestly with the "unclear" verdict rather than guessing "spot_on" or "needs_work".

Always give ONE concrete, actionable tip a learner can literally try next (name the specific sound, syllable,
or stress pattern to fix), phrased warmly and briefly, simple enough for a 10-year-old. Never repeat feedback
verbatim across attempts for the same word — vary the angle (rhythm, a specific consonant, vowel length,
stress) if this is a later attempt.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly:
{"verdict":"spot_on|close|needs_work|unclear","score":0-100,"matchedSounds":[string],
 "mismatchedSounds":[string],"feedback":string,"encouragement":string}`;
}

// ---------------------------------------------------------------------
// Local check (fallback). Stricter than Sprint 2, which accepted any
// transcript within 1 letter, or containing the target anywhere.
// ---------------------------------------------------------------------
function normalise(text) {
  return String(text ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[।॥?!.,;:"'“”‘’()\-_…]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Latin text without accents: "namaskār" -> "namaskar"
const plainLatin = (text) => normalise(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function editDistance(a, b) {
  const x = [...a];
  const y = [...b];
  const rows = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 0; j <= y.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= x.length; i += 1) {
    for (let j = 1; j <= y.length; j += 1) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[x.length][y.length];
}

function localGrade({ targetNative, targetRomanization, transcripts }) {
  const native = normalise(targetNative).replace(/_+/g, "").trim();
  const roman = plainLatin(targetRomanization).replace(/_+/g, "").trim();
  const heard = transcripts.filter((t) => normalise(t.text));
  const model = `The model answer is ${targetNative}${targetRomanization ? ` (${targetRomanization})` : ""}.`;

  if (!heard.length) {
    return {
      verdict: "unclear",
      score: 0,
      matchedSounds: [],
      mismatchedSounds: [],
      feedback: `We could not hear a word that time. ${model} Try again, a little closer to the microphone.`,
      encouragement: "Every try helps your mouth learn the shape of the word.",
    };
  }

  let best = { verdict: "needs_work", score: 0 };
  for (const { text, confidence = 0 } of heard) {
    const said = normalise(text);
    const saidLatin = plainLatin(text);
    const short = [...native].length <= 4;
    // Exact match (script or romanisation) is always right.
    const exact = said === native || (roman && saidLatin === roman);
    // Longer targets: one letter off is fine only when the recogniser was confident.
    const nearNative = !short && editDistance(said, native) <= 1 && confidence >= 0.75;
    const nearRoman = roman && roman.length > 4 && editDistance(saidLatin, roman) <= 1 && confidence >= 0.75;
    if (exact || nearNative || nearRoman) {
      best = { verdict: "spot_on", score: exact ? 95 : 85 };
      break;
    }
    // Close: a small slip, but the recogniser was not confident enough.
    const d = Math.min(editDistance(said, native), roman ? editDistance(saidLatin, roman) : Infinity);
    if (d <= 1 && best.verdict !== "close") best = { verdict: "close", score: 70 };
  }

  const feedback = {
    spot_on: "That matched the target word.",
    close: `Nearly! ${model} Listen once more and copy the ending carefully.`,
    needs_work: `We heard “${heard[0].text}”. ${model} Replay the model and say it slowly, one syllable at a time.`,
  }[best.verdict];

  return {
    verdict: best.verdict,
    score: best.score,
    matchedSounds: [],
    mismatchedSounds: [],
    feedback: `We couldn't reach the pronunciation coach — here's a quick check instead. ${feedback}`,
    encouragement: best.verdict === "spot_on" ? "Well said!" : "Keep going — you are getting closer.",
  };
}

// ---------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------
function stripFences(text) {
  return String(text ?? "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Never trust the model's JSON blindly: check every field.
function cleanResult(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!VERDICTS.includes(raw.verdict)) return null;
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score))));
  if (!Number.isFinite(score)) return null;
  const list = (v) => (Array.isArray(v) ? v.slice(0, 8).map((x) => String(x).slice(0, 60)) : []);
  const text = (v, max) => String(v ?? "").slice(0, max);
  if (!text(raw.feedback, 400).trim()) return null;
  return {
    verdict: raw.verdict,
    score,
    matchedSounds: list(raw.matchedSounds),
    mismatchedSounds: list(raw.mismatchedSounds),
    feedback: text(raw.feedback, 400),
    encouragement: text(raw.encouragement, 200),
  };
}

async function askGemini(input) {
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const url = `${base}/v1beta/models/${env.geminiModel}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(input.language) }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`Gemini answered ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = cleanResult(JSON.parse(stripFences(text)));
    if (!result) throw new Error("Gemini's answer did not have the right shape");
    return result;
  } finally {
    clearTimeout(timer);
  }
}

// The one function the controller calls.
async function grade(input) {
  if (env.geminiApiKey) {
    try {
      return { ...(await askGemini(input)), source: "coach" };
    } catch (err) {
      console.warn(`Pronunciation coach unavailable (${err.name === "AbortError" ? "timed out" : err.message}); using the local check.`);
    }
  }
  return { ...localGrade(input), source: "local" };
}

module.exports = { grade, localGrade, cleanResult, stripFences, systemPrompt, editDistance, VERDICTS, LANGUAGE_NAMES };

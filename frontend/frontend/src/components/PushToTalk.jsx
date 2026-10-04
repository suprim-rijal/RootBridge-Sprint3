import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { gradePronunciation } from "../services/api.js";
import { forSpeech } from "../lib/speech.js";

// Speaking practice ("Echo Studio").
// Converted from storyteller-s-library. The original sent the recording to an
// AI transcription server. Sprint 2 has no server, so this version uses the
// browser's built-in SpeechRecognition (Chrome and Edge support it).
// If the browser has no speech recognition, the child says the word out loud
// and taps "I said it out loud". Speaking never blocks progress.
//
// Sprint 3 (Normal learners only, strict = true): the browser still does
// the listening, but the GRADING is done by the server
// (POST /api/pronunciation/grade), which asks a strict AI coach and
// falls back to a stricter local check. The answer is one of:
//   spot_on | close | needs_work | unclear
// with one concrete tip. Children keep the Sprint 2 check below.

const SpeechRecognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Keep only Devanagari letters / only a-z letters, so we can compare fairly.
const onlyDevanagari = (text) => text.replace(/[^\u0900-\u097F]/g, "");
const onlyLatin = (text) => text.toLowerCase().replace(/[^a-z]/g, "");

// Edit distance: how many single-letter changes turn a into b.
function distance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

// Any script (kana, Latin with ä/ɛ/ɔ …): lower-case, no spaces or punctuation.
const onlyWordChars = (text) =>
  String(text)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s.,!?。、？！「」'"“”‘’()_-]/gu, "");

// A near match counts, so a small accent difference never blocks a right answer.
function isMatch(said, target) {
  const deva = onlyDevanagari(said);
  const wantDeva = onlyDevanagari(target.np);
  if (deva && wantDeva && (deva.includes(wantDeva) || distance(deva, wantDeva) <= 1)) return true;

  // Sprint 3: other scripts (Japanese kana, Finnish ä/ö, Twi ɛ/ɔ).
  // Nepali targets never reach this branch, so the Sprint 2 check for
  // Nepali is unchanged.
  if (!wantDeva) {
    const word = onlyWordChars(said);
    const want = onlyWordChars(target.np);
    if (word && want && (word.includes(want) || distance(word, want) <= 1)) return true;
  }

  const latin = onlyLatin(said.normalize("NFD"));
  const wantLatin = onlyLatin(target.rom.normalize("NFD"));
  if (latin && wantLatin) {
    if (latin.includes(wantLatin)) return true;
    if (distance(latin, wantLatin) <= Math.max(1, Math.floor(wantLatin.length / 4))) return true;
  }
  return false;
}

const BARS = 12;

const VERDICT_LABELS = {
  spot_on: "Spot on",
  close: "Very close",
  needs_work: "Needs work",
  unclear: "We could not tell",
};

//   strict    Normal learners: grade on the server (Sprint 3)
//   language  "nepali" | "finnish" | "japanese" | "twi" (for the coach)
//   speechLang the browser's recognition language, e.g. "ne-NP"
export default function PushToTalk({
  target,
  onResult,
  allowMic = true,
  strict = false,
  language = "nepali",
  speechLang = "ne-NP",
  meaning = "",
}) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | checking | match | miss
  const [coach, setCoach] = useState(null); // the server's verdict + tip
  const attempts = useRef(0);
  const [heard, setHeard] = useState("");
  const [note, setNote] = useState("");
  const recognition = useRef(null);
  // The grading call can answer after the lesson has closed; then we must
  // not touch state any more.
  const alive = useRef(true);

  // Stop listening if the page changes.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      recognition.current?.abort();
    };
  }, []);

  const start = () => {
    setNote("");
    setHeard("");
    setStatus("idle");
    setCoach(null);
    if (!SpeechRecognition) {
      setNote("This browser cannot listen. Say the word out loud, then tap “I said it out loud”.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;

    rec.onresult = async (event) => {
      // Every guess the browser made, with how sure it was.
      const alternatives = Array.from(event.results[0]).map((alt) => ({
        text: alt.transcript,
        confidence: alt.confidence,
      }));
      setHeard(alternatives[0]?.text || "");

      if (!strict) {
        // Sprint 2 check, unchanged for children.
        const matched = alternatives.some((g) => isMatch(g.text, target));
        setStatus(matched ? "match" : "miss");
        onResult(matched);
        return;
      }

      // Sprint 3, Normal learners: the server grades it.
      setStatus("checking");
      attempts.current += 1;
      try {
        const res = await gradePronunciation({
          language,
          targetNative: target.np,
          targetRomanization: target.rom,
          targetMeaning: meaning || target.en,
          transcripts: alternatives,
          attemptNumber: attempts.current,
        });
        if (!alive.current) return;
        setCoach(res.data);
        const right = res.data.verdict === "spot_on";
        setStatus(right ? "match" : "miss");
        onResult(right, res.data.verdict);
      } catch {
        if (!alive.current) return;
        // Server unreachable: fall back to the browser check, never block.
        const matched = alternatives.some((g) => isMatch(g.text, target));
        setStatus(matched ? "match" : "miss");
        onResult(matched, matched ? "spot_on" : "unclear");
      }
    };
    rec.onerror = (event) => {
      setNote(
        event.error === "not-allowed"
          ? "Microphone access is off. That is fine. Say the word out loud, then tap “I said it out loud”."
          : "We could not hear a word that time. Try once more, closer to the microphone.",
      );
    };
    rec.onend = () => setListening(false);

    recognition.current = rec;
    rec.start();
    setListening(true);
  };

  const stop = () => recognition.current?.stop();

  const message = listening
    ? "Listening. Say the word clearly."
    : status === "checking"
      ? "Checking your pronunciation…"
      : coach
        ? ""
        : status === "match"
      ? `That matched ${target.np}. Well said.`
      : status === "miss"
        ? `Not quite yet. We heard “${heard || "nothing clear"}”. Replay the model and try again.`
        : `Tap the button and say ${target.np} (${target.rom}).`;

  return (
    <div className="ln-card ln-mic">
      <div className="ln-row">
        {allowMic ? (
          <button
            type="button"
            className={`btn ${listening ? "btn-terracotta" : "btn-green"}`}
            onClick={listening ? stop : start}
            aria-pressed={listening}
          >
            {listening ? <Square size={18} /> : <Mic size={18} />}
            {listening ? "Stop listening" : `Say ${forSpeech(target.rom) || forSpeech(target.np)}`}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            // Self-check: it lets the learner move on (speaking must never
            // block progress) but it is not graded, so it costs no heart
            // and earns no flower.
            setStatus("skipped");
            onResult(true, "skipped");
          }}
        >
          <MicOff size={16} />I said it out loud
        </button>
      </div>

      {!allowMic ? (
        <p className="ln-muted">The microphone is turned off. Say the word out loud, then tap the button.</p>
      ) : null}
      <div className="ln-meter" aria-hidden="true">
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            className={listening ? "on" : ""}
            style={listening ? { height: `${12 + ((i * 7) % 24)}px` } : undefined}
          />
        ))}
      </div>

      <p className="ln-muted" aria-live="polite">
        {message}
      </p>
      {coach ? (
        <div className={`ln-coach ${coach.verdict}`} aria-live="polite">
          <b>
            {VERDICT_LABELS[coach.verdict]}
            {Number.isFinite(coach.score) ? ` · ${coach.score}/100` : ""}
          </b>
          {heard ? <p className="ln-muted">We heard: “{heard}”</p> : null}
          <p>{coach.feedback}</p>
          {coach.mismatchedSounds?.length ? (
            <p className="ln-muted">To fix: {coach.mismatchedSounds.join(", ")}</p>
          ) : null}
          {coach.encouragement ? <p className="ln-coach-cheer">{coach.encouragement}</p> : null}
        </div>
      ) : null}
      {note ? <p className="ln-instructions">{note}</p> : null}
    </div>
  );
}

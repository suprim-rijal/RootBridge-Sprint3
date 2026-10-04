import { useEffect, useState } from "react";
import { AudioLines, Keyboard, Lightbulb, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import PushToTalk from "./PushToTalk.jsx";
import { speakWord, stopSpeaking } from "../lib/speech.js";
import LivesBar from "./LivesBar.jsx";

// Plays a list of exercises one step at a time.
// Converted from storyteller-s-library (TypeScript + Tailwind -> JSX + Elearn CSS).
//
// Props:
//   exercises     array from buildLesson() or buildTest() in lib/exercises.js
//   romanization  show latin spelling under Nepali words
//   quiet         quest mode: do not reveal right/wrong colours
//   reducedMotion slower speech
//   onFinish      called with { flowers, hintsUsed, scores } after the last step
//
// Exercise kinds: "hear-find", "meaning", "match", "matra" (choose a card),
// "typing" (type the word), "echo" (say the word).
// Sprint 3, Normal learners only: "cloze" (choose the missing word) and
// "sentence-order" (tap the words into order).
//
// Sprint 3 lives props (all optional; children never get them, so their
// lesson looks and behaves exactly as in Sprint 2):
//   livesMode      true for Normal learners: hearts, paid hints
//   lives          current number of hearts (from useLives)
//   onWrongAnswer  called with "wrong" | "speech" after a wrong answer
//   onHintUsed     called after the learner confirmed using a hint
//   outOfLives     what to show instead of the exercise at 0 hearts

// Typing: most learners have no Devanagari, kana or ɛ/ɔ keyboard, so the
// romanisation counts as correct too ("namaste" for नमस्ते). Accents and
// punctuation are ignored, spelling is not.
const plain = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s.,!?।॥-]/g, "");
const typedIsCorrect = (typed, target) => {
  const answer = String(typed).trim();
  if (!answer) return false;
  if (answer === target.np) return true;
  return Boolean(target.rom) && plain(answer) === plain(target.rom);
};

const LANGUAGE_LABELS = { nepali: "Nepali", finnish: "Finnish", japanese: "Japanese", twi: "Twi" };
// The HTML lang code for each language, so screen readers read words right.
const HTML_LANG = { nepali: "ne", finnish: "fi", japanese: "ja", twi: "ak" }; // same as curriculum.js htmlLangOf

const emptyScores = { accuracy: 0, independence: 0, matraPlacement: 0, strokeOrder: 0, retries: 0 };

//   allowMic      false = a parent turned the microphone off

export default function LessonEngine({
  exercises,
  romanization = true,
  quiet = false,
  reducedMotion = false,
  allowMic = true,
  onFinish,
  livesMode = false,
  lives = null,
  onWrongAnswer,
  onHintUsed,
  outOfLives = null,
  language = "nepali",
  speechLang = "ne-NP",
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null); // index of the chosen card
  const [typed, setTyped] = useState("");
  const [echoDone, setEchoDone] = useState(false);
  const [echoTries, setEchoTries] = useState(0);
  const [hint, setHint] = useState(0); // 0 = no hint open, 1-4 = hint level
  const [flowers, setFlowers] = useState(0); // one flower per solved step
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioNote, setAudioNote] = useState("");
  const [scores, setScores] = useState(emptyScores);
  const [solved, setSolved] = useState(() => exercises.map(() => false));
  const [arranged, setArranged] = useState([]); // word order / scramble: tapped tiles
  const [pairPick, setPairPick] = useState(null); // pair-up: the word tapped first
  const [pairsDone, setPairsDone] = useState([]); // pair-up: ids already matched
  const [pairWrong, setPairWrong] = useState(null); // pair-up: the pair that just failed
  const [confirmHint, setConfirmHint] = useState(false); // lives mode: "use a hint?"

  const ex = exercises[step];

  // Stop any speech when leaving the page.
  useEffect(() => () => stopSpeaking(), []);

  // Keyboard: number keys 1-4 pick a card.
  useEffect(() => {
    const onKey = (event) => {
      if (!ex || ["typing", "echo", "sentence-order", "scramble", "pair-up"].includes(ex.kind)) return;
      if (event.target instanceof HTMLInputElement) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < ex.options.length) pick(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ex) return <p className="ln-muted">This lesson has no practice steps yet.</p>;

  const chosen = selected === null ? null : ex.options[selected];
  const isOrdering = ex.kind === "sentence-order" || ex.kind === "scramble";
  const orderDone = isOrdering && solved[step];
  const pairUpDone = ex.kind === "pair-up" && ex.pairs.length > 0 && pairsDone.length === ex.pairs.length;
  const isCorrect =
    ex.kind === "typing"
      ? typedIsCorrect(typed, ex.target)
      : ex.kind === "echo"
        ? echoDone
        : isOrdering
          ? orderDone
          : ex.kind === "pair-up"
            ? pairUpDone
          : chosen?.np === ex.target.np;
  const isLast = step === exercises.length - 1;
  // For listening tasks we hide the word, so the child has to use their ears.
  // Cloze and word order show their own sentence instead of the word card.
  const listening = ex.kind === "hear-find" || ex.kind === "typing";
  // "Replay word" makes no sense when there is no single target word.
  const hideAudio = ex.kind === "true-false" || ex.kind === "pair-up";
  const hideWordCard =
    listening || ["cloze", "sentence-order", "scramble", "pair-up", "true-false", "odd-one-out"].includes(ex.kind);
  // Lives mode, at 0 hearts: the exercise is replaced (unless already solved).
  const blocked = livesMode && lives === 0 && !isCorrect;

  // ----- audio -----
  // Words are spoken in the lesson's language (speechLang); instructions in English.
  const speak = (text = ex.target.np, lang = speechLang) => {
    setAudioNote("");
    const isWord = lang !== "en-US";
    speakWord(text, {
      lang,
      englishFallback: isWord ? `${ex.target.rom}. It means ${ex.target.en}.` : text,
      rate: reducedMotion ? 0.75 : Math.max(0.65, 0.9 - hint * 0.06),
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onUnavailable: () => {
        setPlaying(false);
        setAudioNote("This device cannot play sound right now. Read the word and its spelling instead.");
      },
    });
  };
  const stop = () => {
    stopSpeaking();
    setPlaying(false);
  };

  // ----- scoring -----
  const markSolved = () => {
    if (solved[step]) return; // only count each step once
    setFlowers((f) => f + 1);
    setSolved((list) => list.map((value, i) => (i === step ? true : value)));
    setScores((s) => ({
      ...s,
      accuracy: s.accuracy + 1,
      independence: s.independence + (hint === 0 ? 1 : 0),
      matraPlacement: s.matraPlacement + (ex.dimensions.includes("matraPlacement") ? 1 : 0),
      strokeOrder: s.strokeOrder + (ex.dimensions.includes("strokeOrder") ? 1 : 0),
    }));
  };
  const addRetry = () => setScores((s) => ({ ...s, retries: s.retries + 1 }));
  // A wrong answer: counted as a retry, and in lives mode it costs a heart.
  const wrong = (reason = "wrong") => {
    addRetry();
    if (livesMode) onWrongAnswer?.(reason);
  };

  // ----- answering -----
  function pick(index) {
    if (blocked || solved[step]) return;
    if (livesMode && selected === index) return; // the same wrong card twice costs nothing extra
    setSelected(index);
    setAttempts((n) => n + 1);
    if (ex.options[index]?.np === ex.target.np) markSolved();
    else wrong("wrong");
  }
  const submitTyped = () => {
    if (blocked || solved[step]) return;
    setAttempts((n) => n + 1);
    if (typedIsCorrect(typed, ex.target)) markSolved();
    else wrong("wrong");
  };
  // verdict comes from the strict grader (Normal learners). "close" means
  // "keep trying": it is not counted as a wrong answer and costs no heart.
  const onSpoken = (matched, verdict) => {
    setEchoTries((n) => n + 1);
    setAttempts((n) => n + 1);
    if (verdict === "skipped") {
      // "I said it out loud": move on, but it is not graded, so no flower
      // and no heart lost.
      setEchoDone(true);
      setSolved((list) => list.map((v, i) => (i === step ? true : v)));
      return;
    }
    if (matched) {
      setEchoDone(true);
      markSolved();
    } else if (verdict === "close") addRetry();
    else wrong("speech");
  };
  // pair-up: tap a word, then its meaning
  const tapWord = (id) => {
    if (blocked || pairsDone.includes(id)) return;
    setPairWrong(null);
    setPairPick(id);
  };
  const tapMeaning = (id) => {
    if (blocked || pairPick === null || pairsDone.includes(id)) return;
    setAttempts((n) => n + 1);
    if (id === pairPick) {
      const done = [...pairsDone, id];
      setPairsDone(done);
      setPairPick(null);
      if (done.length === ex.pairs.length) markSolved();
    } else {
      setPairWrong(id);
      setPairPick(null);
      wrong("wrong");
    }
  };

  // word order / scramble: tap a tile to place it, tap a placed tile to take it back
  const placeTile = (tile) => setArranged((list) => [...list, tile]);
  const removeTile = (index) => setArranged((list) => list.filter((_, i) => i !== index));
  const checkOrder = () => {
    if (blocked || solved[step]) return;
    setAttempts((n) => n + 1);
    const right = arranged.length === ex.tiles.length && arranged.every((t, i) => t.id === i);
    if (right) markSolved();
    else wrong("wrong");
  };
  // Hints: free for children; in lives mode, confirmed first, then paid.
  const openHint = () => {
    // Only the FIRST hint on a question costs a heart; the next levels of
    // the same hint are free, so nobody pays four hearts for one word.
    if (livesMode && hintsUsed === 0) {
      setConfirmHint(true);
      return;
    }
    setHint((h) => Math.min(h + 1, 4));
    setHintsUsed((h) => h + 1);
  };
  const acceptHint = () => {
    setConfirmHint(false);
    setHint((h) => Math.min(h + 1, 4));
    setHintsUsed((h) => h + 1);
    onHintUsed?.(); // charges one heart, once per question
  };

  const next = () => {
    if (isLast) {
      onFinish({ flowers, hintsUsed, scores });
      return;
    }
    stop();
    setStep((n) => n + 1);
    setSelected(null);
    setTyped("");
    setEchoDone(false);
    setEchoTries(0);
    setHint(0);
    setAttempts(0);
    setArranged([]);
    setPairPick(null);
    setPairsDone([]);
    setPairWrong(null);
    setConfirmHint(false);
  };

  const hintText = [
    "Replay the model and listen for the first sound.",
    `Look closely at: ${ex.options
      .slice(0, 2)
      .map((o) => o.np)
      .join(" / ")}`,
    `The word sounds like “${ex.target.rom}”.`,
    `Model answer: ${ex.target.np}, ${ex.target.rom}, ${ex.target.en}.`,
  ];

  // Colour for a choice card after it was picked.
  const optionClass = (index, option) => {
    if (selected !== index) return "ln-option";
    if (quiet) return "ln-option picked";
    return option.np === ex.target.np ? "ln-option right" : "ln-option wrong";
  };

  return (
    <div>
      {/* Progress dots + flower counter */}
      <div className="ln-row">
        <span className="ln-steps" aria-label={`Step ${step + 1} of ${exercises.length}`}>
          {exercises.map((_, i) => (
            <span key={i} className={i < step ? "past" : i === step ? "now" : ""} />
          ))}
        </span>
        <span className="ln-badge gold">{flowers} ✿ flowers</span>
        <span className="ln-badge track">{ex.mechanic}</span>
        {livesMode && lives !== null ? <LivesBar lives={{ enabled: true, lives, max: 7 }} /> : null}
      </div>

      <p className="ln-instructions">
        <Keyboard size={17} aria-hidden="true" />
        {ex.instructions_text}
      </p>
      <h2 className="ln-prompt">{ex.prompt}</h2>

      {/* Show the word, except in listening tasks */}
      {ex.kind === "true-false" ? (
        <div className="ln-card bold ln-statement">
          <span lang={HTML_LANG[language] ?? "ne"}>{ex.statement}</span>
        </div>
      ) : null}

      {ex.kind === "cloze" ? (
        <div className="ln-card bold ln-sentence" lang={HTML_LANG[language] ?? "ne"}>
          {ex.sentence}
          <span className="ln-muted">“{ex.meaning}”</span>
        </div>
      ) : null}

      {!hideWordCard ? (
        <div className="ln-card bold ln-big-word">
          <span lang={HTML_LANG[language] ?? "ne"}>{ex.target.np}</span>
          {romanization ? <span className="ln-muted">{ex.target.rom}</span> : null}
        </div>
      ) : null}

      {/* Audio controls */}
      <div className="ln-row" style={{ marginTop: 16 }}>
        {hideAudio ? null : (
          <button type="button" className="btn btn-green btn-sm" onClick={() => speak()}>
            <AudioLines size={17} />
            Replay word
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={playing ? stop : () => speak(ex.instructions_audio, "en-US")}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "Pause" : "Instructions"}
        </button>
        <span className="ln-muted" aria-live="polite">
          {playing ? "Audio is playing" : ""}
        </span>
      </div>
      {audioNote ? (
        <p className="ln-instructions">
          {audioNote}
          {listening ? ` The word is ${ex.target.np} (${ex.target.rom}).` : ""}
        </p>
      ) : null}

      {/* Answer area: typing, speaking, word order, or choice cards */}
      {blocked ? (
        outOfLives
      ) : ex.kind === "pair-up" ? (
        <div className="ln-pairs">
          <ul className="ln-pair-col" aria-label="Words">
            {ex.pairs.map((pair) => (
              <li key={pair.id}>
                <button
                  type="button"
                  className={`ln-pair ${pairPick === pair.id ? "picked" : ""} ${pairsDone.includes(pair.id) ? "matched" : ""}`}
                  onClick={() => tapWord(pair.id)}
                  disabled={pairsDone.includes(pair.id)}
                  lang={HTML_LANG[language] ?? "ne"}
                >
                  {pair.np}
                  {romanization && pair.rom ? <small>{pair.rom}</small> : null}
                </button>
              </li>
            ))}
          </ul>
          <ul className="ln-pair-col" aria-label="Meanings">
            {ex.meanings.map((meaning) => (
              <li key={meaning.id}>
                <button
                  type="button"
                  className={`ln-pair meaning ${pairsDone.includes(meaning.id) ? "matched" : ""} ${pairWrong === meaning.id ? "wrong" : ""}`}
                  onClick={() => tapMeaning(meaning.id)}
                  disabled={pairsDone.includes(meaning.id)}
                >
                  {meaning.en}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : isOrdering ? (
        <div className="ln-order">
          <div className="ln-order-line" aria-label="Your sentence">
            {arranged.length === 0 ? (
              <span className="ln-muted">
                {ex.kind === "scramble" ? "Tap the letters below, in order." : "Tap the words below, in order."}
              </span>
            ) : null}
            {arranged.map((tile, i) => (
              <button key={`${tile.id}-${i}`} type="button" className="ln-chip placed" onClick={() => removeTile(i)} disabled={orderDone}>
                <span lang={HTML_LANG[language] ?? "ne"}>{tile.np}</span>
                {romanization && tile.rom ? <small>{tile.rom}</small> : null}
              </button>
            ))}
          </div>
          <div className="ln-order-bank">
            {ex.tiles.map((tile) => {
              const used = arranged.some((t) => t.id === tile.id);
              return (
                <button key={tile.id} type="button" className="ln-chip" onClick={() => placeTile(tile)} disabled={used || orderDone}>
                  <span lang={HTML_LANG[language] ?? "ne"}>{tile.np}</span>
                  {romanization && tile.rom ? <small>{tile.rom}</small> : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-track btn-sm"
            onClick={checkOrder}
            disabled={orderDone || arranged.length !== ex.tiles.length}
          >
            Check
          </button>
        </div>
      ) : ex.kind === "typing" ? (
        <div className="ln-type-row">
          <input
            lang={HTML_LANG[language] ?? "ne"}
            className="ln-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            aria-label="Type your answer"
            placeholder={`Type in ${LANGUAGE_LABELS[language] ?? "Nepali"} or in letters (${ex.target.rom})`}
          />
          <button type="button" className="btn btn-track" onClick={submitTyped}>
            Check
          </button>
        </div>
      ) : ex.kind === "echo" ? (
        <div>
          <PushToTalk
            key={ex.id}
            target={ex.target}
            onResult={onSpoken}
            allowMic={allowMic}
            strict={livesMode}
            language={language}
            speechLang={speechLang}
          />
          {!echoDone && echoTries >= 3 ? (
            <div className="ln-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={next}>
                Move on for now
              </button>
              <span className="ln-muted">You can come back to this word later.</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="ln-options">
          {ex.options.map((option, i) => (
            <div key={option.np + i} className={optionClass(i, option)}>
              <button type="button" className="ln-option-main" onClick={() => pick(i)}>
                <span className="num">{i + 1}</span>
                <span className="word" lang={ex.show === "np" ? (HTML_LANG[language] ?? "ne") : undefined}>
                  {ex.show === "np" ? option.np : option.en}
                </span>
                {romanization && ex.show === "np" ? <small>{option.rom}</small> : null}
              </button>
              {ex.kind === "true-false" ? null : (
                <button
                  type="button"
                  className="ln-icon-btn"
                  aria-label={`Hear option ${i + 1}`}
                  onClick={() => speak(option.np)}
                >
                  <Volume2 size={17} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hints and retry (hidden while out of hearts) */}
      {blocked ? null : (
      <div className="ln-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={openHint} disabled={blocked || hint >= 4}>
          <Lightbulb size={16} />
          Hint {Math.min(hint + 1, 4)}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setSelected(null);
            setTyped("");
            setEchoDone(false);
            setArranged([]);
          }}
        >
          <RotateCcw size={16} />
          Try again
        </button>
        <span className="ln-muted">
          {livesMode ? "Each wrong answer or hint costs one heart." : "Unlimited tries. Hints never cost anything."}
        </span>
      </div>
      )}
      {confirmHint ? (
        <div className="ln-card warn ln-confirm" role="alertdialog" aria-label="Use a hint?">
          <p>Use a hint? The first hint on this question costs 1 heart. More hints on it are free.</p>
          <div className="ln-row">
            <button type="button" className="btn btn-dark btn-sm" onClick={acceptHint}>
              Yes, show the hint
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmHint(false)}>
              No, keep my heart
            </button>
          </div>
        </div>
      ) : null}
      {hint > 0 ? (
        <div className="ln-card" style={{ marginTop: 14, background: "var(--bg)" }}>
          <b>Hint {hint}</b>
          <p className="ln-muted" style={{ margin: "4px 0 0" }}>
            {hintText[hint - 1]}
          </p>
        </div>
      ) : null}

      {/* Normal learners: "Explain more", open by default.
          The word-by-word breakdown only appears once the step is solved,
          so the explanation can never give the answer away. */}
      {livesMode && ex.explain && !blocked && (ex.kind !== "true-false" || isCorrect) ? (
        <details className="ln-explain" open>
          <summary>Explain more</summary>
          <p>
            <b>Meaning:</b> {ex.explain.meaning}
          </p>
          {isCorrect && ex.explain.breakdown.length > 1 ? (
            <ul className="ln-breakdown">
              {ex.explain.breakdown.map((w, i) => (
                <li key={`${w.np}-${i}`}>
                  <span lang={HTML_LANG[language] ?? "ne"}>{w.np}</span>
                  {w.rom ? <small>{w.rom}</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {!isCorrect && ex.explain.breakdown.length > 1 ? (
            <p className="ln-muted">Solve the step to see each word with its pronunciation.</p>
          ) : null}
          {ex.explain.tip ? <p className="ln-muted">{ex.explain.tip}</p> : null}
        </details>
      ) : null}

      {/* Feedback */}
      <div className="ln-feedback" aria-live="polite">
        {isCorrect ? (
          <div className="ln-card success">
            <p>
              {quiet
                ? "Answer saved."
                : ex.kind === "true-false"
                  ? ex.fact
                  : ex.kind === "pair-up"
                    ? "All three pairs matched."
                    : ex.kind === "odd-one-out"
                      ? `${ex.target.np} belongs to another module.`
                      : ex.kind === "scramble"
                        ? `Shabash! ${ex.target.np} means ${ex.target.en}.`
                        : ex.kind === "sentence-order" || ex.kind === "cloze"
                  ? `Shabash! “${ex.kind === "cloze" ? ex.explain.meaning : ex.target.en}”.`
                  : `Shabash! ${ex.target.np} means ${ex.target.en}.`}
            </p>
            <button type="button" className="btn btn-green btn-sm" onClick={next}>
              {isLast ? "Finish" : "Next step"}
            </button>
          </div>
        ) : attempts > 0 && !blocked ? (
          <div className="ln-card warn">
            <p>
              {livesMode
                ? "Not yet — that cost a heart. Replay the model or open a hint, then try again."
                : "Not yet. Replay the model or open a hint, then try again."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

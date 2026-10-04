// Builds the practice steps for a lesson or a module quest from a module's vocabulary.
// Converted from storyteller-s-library (TypeScript -> plain JS), then extended
// in Sprint 3 with more mechanics and a plan per track and lesson phase.
import { allModules } from "../data/curriculum.js";
function order(list, seed) {
  return [...list].sort((a, b) => {
    const ha = (JSON.stringify(a).length * 31 + seed) % 17;
    const hb = (JSON.stringify(b).length * 31 + seed) % 17;
    return ha - hb || JSON.stringify(a).localeCompare(JSON.stringify(b));
  });
}
const formats = [
  {
    kind: "hear-find",
    mechanic: "Hear It, Find It",
    instructions_text:
      "Listen, then choose the matching word. Use number keys 1 to 4 or tap a card.",
    dimensions: ["accuracy", "independence"],
  },
  {
    kind: "typing",
    mechanic: "Dictation Garden",
    instructions_text:
      "Listen and type the Nepali word. You can copy the model after using a hint.",
    dimensions: ["accuracy", "matraPlacement", "independence"],
  },
  {
    kind: "echo",
    mechanic: "Echo Studio",
    instructions_text:
      "Listen, then say the word aloud or use the no-microphone check.",
    dimensions: ["accuracy", "independence"],
  },
  {
    kind: "matra",
    mechanic: "Missing Matra",
    instructions_text:
      "Choose the complete word. Look closely at where the vowel mark sits.",
    dimensions: ["accuracy", "matraPlacement", "independence"],
  },
  {
    kind: "match",
    mechanic: "Word Match",
    instructions_text:
      "Match the Nepali word to its meaning. Use number keys or tap a card.",
    dimensions: ["accuracy", "independence"],
  },
  {
    kind: "meaning",
    mechanic: "Read and Choose",
    instructions_text:
      "Read the word, then choose its meaning. Use number keys or tap a card.",
    dimensions: ["accuracy", "independence"],
  },
];
// Sprint 3: other languages. Nepali text stays exactly as in Sprint 2.
const LANGUAGE_NAMES = { nepali: "Nepali", finnish: "Finnish", japanese: "Japanese", twi: "Twi" };
function forLanguage(format, language) {
  if (language === "nepali") return format;
  const name = LANGUAGE_NAMES[language] ?? "target";
  if (format.kind === "matra") {
    // "Missing Matra" is about Devanagari vowel signs; other scripts get a
    // general spelling check with the same choose-a-card mechanic.
    return {
      ...format,
      mechanic: "Spelling Check",
      instructions_text:
        language === "japanese"
          ? "Choose the correctly written word. Look closely at every character."
          : "Choose the correctly spelled word. Look closely at every letter.",
    };
  }
  return { ...format, instructions_text: format.instructions_text.replace("Nepali", name) };
}

// One step of a Sprint 2 kind ("hear-find", "typing", "echo", "matra",
// "match", "meaning") for one word.
function buildOne(mod, target, kind, seed, id) {
  const language = mod.language || "nepali";
  const format = forLanguage(formats.find((f) => f.kind === kind) ?? formats[0], language);
  const pool = mod.items.filter((x) => x.np !== target.np);
  const options = order([target, ...order(pool, seed).slice(0, 3)], seed * 3);
  const show = format.kind === "meaning" || format.kind === "match" ? "en" : "np";
  return {
    ...format,
    id,
    instructions_audio: format.instructions_text,
    prompt:
      format.kind === "typing"
        ? `Type the word for “${target.en}”.`
        : format.kind === "echo"
          ? `Say “${target.np}” after the model.`
          : format.kind === "matra"
            ? `Which spelling says “${target.en}”?`
            : show === "np"
              ? `Choose the ${LANGUAGE_NAMES[language] ?? "Nepali"} for “${target.en}”.`
              : `What does ${target.np} mean?`,
    target,
    options,
    show,
  };
}

// ---------------------------------------------------------------------
// Sprint 3: two extra styles for Normal learners only ("normal" mode).
//   cloze           a phrase with one word missing; choose the word
//   sentence-order  the phrase's words shuffled; tap them into order
// Both come with an "Explain more" panel: the meaning, each word with
// its romanisation, and a short grammar tip. Children ("standard" mode)
// never get these, so their lessons stay exactly as in Sprint 2.
// ---------------------------------------------------------------------
const GAP = "___";
const PUNCTUATION = /[।॥?!.,;:]+$/u;

// A short, true grammar tip per language, shown under "Explain more".
const GRAMMAR_TIPS = {
  nepali: "Nepali usually puts the verb at the end of the sentence: subject, then object, then verb.",
  finnish: "Finnish has no words for “a” or “the”, and word endings do much of the work that English does with separate words.",
  japanese: "Japanese usually puts the verb at the end, and small particles like は (wa) and を (o) mark the role of each word.",
  twi: "Twi usually follows subject, verb, object, like English. Tone (a word's pitch) can change its meaning.",
};

const splitWords = (text) => String(text).trim().split(/\s+/).filter(Boolean);
const bare = (word) => word.replace(PUNCTUATION, "");

// Phrases we can work with: 2+ real words, and romanisation that lines
// up word for word, so every word can show its pronunciation.
function phrasesOf(mod) {
  return mod.items
    .map((item) => {
      const words = splitWords(item.np);
      const roms = splitWords(item.rom);
      const real = words.filter((w) => w !== GAP && bare(w));
      return { item, words, roms: roms.length === words.length ? roms : [], realCount: real.length };
    })
    .filter((p) => p.realCount >= 2);
}

function explainFor(mod, item, words = splitWords(item.np), roms = splitWords(item.rom)) {
  return {
    meaning: item.en,
    breakdown: words.map((np, i) => ({ np, rom: roms.length === words.length ? roms[i] : "" })),
    tip: item.note || GRAMMAR_TIPS[mod.language || "nepali"] || "",
    goal: mod.goal,
  };
}

function buildCloze(mod, phrase, seed) {
  const { item, words, roms } = phrase;
  const candidates = words.map((w, i) => ({ w, i })).filter(({ w }) => w !== GAP && bare(w));
  const pick = candidates[seed % candidates.length];
  const answer = bare(pick.w);

  // Distractors: other words from this module, never the answer.
  const pool = [
    ...new Set(
      mod.items
        .flatMap((x) => splitWords(x.np))
        .map(bare)
        .filter((w) => w && w !== GAP.replace(/_/g, "") && w !== answer && !w.includes("_")),
    ),
  ];
  const distractors = order(pool, seed + 5).slice(0, 3);
  const romOf = (w) => {
    const index = words.findIndex((x) => bare(x) === w);
    return index >= 0 && roms.length ? bare(roms[index]) : "";
  };
  const options = order(
    [answer, ...distractors].map((w) => ({ np: w, rom: romOf(w), en: "" })),
    seed + 11,
  );
  const shown = words.map((w, i) => (i === pick.i ? "＿＿＿" : w === GAP ? "…" : w)).join(" ");

  return {
    kind: "cloze",
    mechanic: "Fill the Gap",
    instructions_text: "Read the sentence and choose the missing word.",
    instructions_audio: "Read the sentence and choose the missing word.",
    dimensions: ["accuracy", "independence"],
    id: `${mod.id}-cloze-${seed}`,
    prompt: `Fill the gap: “${shown}”`,
    sentence: shown,
    meaning: item.en,
    target: { np: answer, rom: romOf(answer), en: item.en },
    options,
    show: "np",
    explain: explainFor(mod, item, words, roms),
  };
}

function buildOrder(mod, phrase, seed) {
  const { item, words, roms } = phrase;
  const tiles = words.map((np, i) => ({ id: i, np, rom: roms[i] ?? "" }));
  // Shuffle, but never leave it already in the right order.
  let shuffled = order(tiles, seed + 3);
  if (shuffled.every((t, i) => t.id === i)) shuffled = [...shuffled.slice(1), shuffled[0]];

  return {
    kind: "sentence-order",
    mechanic: "Word Order",
    instructions_text: "Tap the words in the right order to build the sentence.",
    instructions_audio: "Tap the words in the right order to build the sentence.",
    dimensions: ["accuracy", "independence"],
    id: `${mod.id}-order-${seed}`,
    prompt: `Build the sentence that means “${item.en}”.`,
    target: item,
    tiles: shuffled,
    options: [],
    show: "np",
    explain: explainFor(mod, item, words, roms),
  };
}

// Adds the detailed explanation to the usual exercise kinds too, for
// Normal learners.
const withExplain = (mod, list) =>
  list.map((ex) => (ex.explain ? ex : { ...ex, explain: explainFor(mod, ex.target) }));


// =====================================================================
// Sprint 3: more variety, so a lesson does not feel like the last one.
// ---------------------------------------------------------------------
// Four new mechanics, on top of the Sprint 2 ones:
//   pair-up       tap a word, then its meaning (three pairs)
//   odd-one-out   three words belong together, one does not
//   true-false    is this statement right? (great for culture facts)
//   scramble      the letters of one word, shuffled
//
// Which mechanics a lesson uses depends on the TRACK and the lesson's
// PHASE, so the four lessons of a module feel different from each other,
// and a culture lesson does not feel like a language drill.
// =====================================================================

// Language track: Encounter -> Notice -> Retrieve -> Use
const LANGUAGE_PLAN = {
  Encounter: ["hear-find", "meaning", "pair-up", "hear-find"],
  Notice: ["matra", "odd-one-out", "match", "scramble"],
  Retrieve: ["typing", "scramble", "pair-up", "match"],
  Use: ["echo", "meaning", "typing", "hear-find"],
};
// Culture track: Encounter -> Notice -> Compare -> Create
const CULTURE_PLAN = {
  Encounter: ["meaning", "hear-find", "pair-up", "match"],
  Notice: ["true-false", "odd-one-out", "match", "meaning"],
  Compare: ["pair-up", "true-false", "meaning", "hear-find"],
  Create: ["echo", "true-false", "typing", "match"],
};

// Split a word into characters a learner would recognise (a Devanagari
// letter with its vowel mark counts as one).
function graphemes(text) {
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...segmenter.segment(String(text))].map((g) => g.segment).filter((g) => g.trim());
  } catch {
    return [...String(text)].filter((g) => g.trim());
  }
}

// Words from OTHER modules of the same language, for "odd one out".
function outsideWords(mod) {
  return allModules
    .filter((m) => m.language === mod.language && m.id !== mod.id && m.id.replace(/^[a-z]{2}-/, "")[0] === mod.id.replace(/^[a-z]{2}-/, "")[0])
    .flatMap((m) => m.items)
    .filter((item) => !item.np.includes("_") && !item.np.includes(" "));
}

function buildPairUp(mod, seed, id) {
  const pairs = order(mod.items.filter((i) => !i.np.includes("_")), seed).slice(0, 3);
  return {
    kind: "pair-up",
    mechanic: "Pair Up",
    instructions_text: "Tap a word, then tap its meaning. Three pairs to find.",
    instructions_audio: "Tap a word, then tap its meaning.",
    dimensions: ["accuracy", "independence"],
    id,
    prompt: "Match each word to its meaning.",
    pairs: pairs.map((item, i) => ({ id: i, np: item.np, rom: item.rom, en: item.en })),
    meanings: order(pairs.map((item, i) => ({ id: i, en: item.en })), seed + 7),
    target: pairs[0],
    options: [],
    show: "np",
  };
}

function buildOddOneOut(mod, seed, id) {
  const mine = order(mod.items.filter((i) => !i.np.includes("_")), seed).slice(0, 3);
  const outsiders = outsideWords(mod);
  if (mine.length < 3 || !outsiders.length) return null;
  const stranger = outsiders[seed % outsiders.length];
  return {
    kind: "odd-one-out",
    mechanic: "Odd One Out",
    instructions_text: "Three of these words are from this module. Tap the one that is not.",
    instructions_audio: "Tap the word that does not belong to this module.",
    dimensions: ["accuracy", "independence"],
    id,
    prompt: `Which word is not part of “${mod.title}”?`,
    target: stranger,
    options: order([stranger, ...mine], seed + 3),
    show: "np",
  };
}

function buildTrueFalse(mod, seed, id) {
  const items = mod.items.filter((i) => i.en);
  if (items.length < 2) return null;
  const item = items[seed % items.length];
  const isTrue = seed % 2 === 0;
  const otherMeaning = items[(seed + 1) % items.length].en;
  const claimed = isTrue ? item.en : otherMeaning === item.en ? items[(seed + 2) % items.length].en : otherMeaning;
  const answer = isTrue ? "True" : "False";
  return {
    kind: "true-false",
    mechanic: "True or False",
    instructions_text: "Read the sentence and decide whether it is right.",
    instructions_audio: "Is this sentence right?",
    dimensions: ["accuracy", "independence"],
    id,
    prompt: "Is this right?",
    statement: `${item.np}${item.rom ? ` (${item.rom})` : ""} means “${claimed}”.`,
    target: { np: answer, rom: "", en: item.en },
    options: [
      { np: "True", rom: "", en: "True" },
      { np: "False", rom: "", en: "False" },
    ],
    show: "np",
    fact: `${item.np} means “${item.en}”.`,
  };
}

function buildScramble(mod, seed, id) {
  const words = mod.items.filter((i) => !i.np.includes("_") && !i.np.includes(" ") && graphemes(i.np).length >= 3);
  if (!words.length) return null;
  const item = words[seed % words.length];
  const letters = graphemes(item.np).map((np, i) => ({ id: i, np, rom: "" }));
  let shuffled = order(letters, seed + 5);
  if (shuffled.every((t, i) => t.id === i)) shuffled = [...shuffled.slice(1), shuffled[0]];
  return {
    kind: "scramble",
    mechanic: "Letter Scramble",
    instructions_text: "The letters are mixed up. Tap them in the right order.",
    instructions_audio: "Put the letters in the right order.",
    dimensions: ["accuracy", "matraPlacement"],
    id,
    prompt: `Build the word for “${item.en}”.`,
    target: item,
    tiles: shuffled,
    options: [],
    show: "np",
  };
}

// Builds one step of a given kind, or null when the module's content
// cannot support it (e.g. no phrases for a word-order step).
function buildKind(kind, mod, item, seed, id, phrases) {
  switch (kind) {
    case "pair-up":
      return mod.items.length >= 3 ? buildPairUp(mod, seed, id) : null;
    case "odd-one-out":
      return buildOddOneOut(mod, seed, id);
    case "true-false":
      return buildTrueFalse(mod, seed, id);
    case "scramble":
      return buildScramble(mod, seed, id);
    case "cloze":
      return phrases.length ? buildCloze(mod, phrases[seed % phrases.length], seed) : null;
    case "sentence-order":
      return phrases.length ? buildOrder(mod, phrases[seed % phrases.length], seed) : null;
    default:
      return buildOne(mod, item, kind, seed, id); // the Sprint 2 kinds
  }
}

// The phase of a lesson decides how it feels. Language lessons run
// Encounter -> Notice -> Retrieve -> Use; culture lessons run
// Encounter -> Notice -> Compare -> Create.
function planFor(mod, lesson, mode, lessonNumber = 0) {
  const isCulture = mod.id.replace(/^[a-z]{2}-/, "").startsWith("c");
  const plans = isCulture ? CULTURE_PLAN : LANGUAGE_PLAN;
  const phase = lesson?.phase ?? "Encounter";
  const base = plans[phase] ?? LANGUAGE_PLAN.Encounter;
  if (mode !== "normal") return base;
  // Normal learners also get the two sentence mechanics. They alternate
  // between lessons, and sit in a different place each time, so no two
  // lessons of a module have the same shape.
  const extra = lessonNumber % 2 === 0 ? "cloze" : "sentence-order";
  const at = 1 + (lessonNumber % 3);
  return [...base.slice(0, at), extra, ...base.slice(at)];
}

// Backup kinds, used when a module cannot support a planned one (for
// example a module of single words has no phrases to scramble into order).
const FALLBACKS = ["meaning", "hear-find", "match", "typing", "echo", "matra"];

function buildLesson(mod, lessonIndex, mode = "standard") {
  if (!mod.items.length) return [];
  const lesson = mod.lessons?.[lessonIndex];
  const phrases = phrasesOf(mod);
  // Each step works on a different word.
  const rotated = [...mod.items.slice(lessonIndex % mod.items.length), ...mod.items.slice(0, lessonIndex % mod.items.length)];

  const steps = [];
  const plan = planFor(mod, lesson, mode, lessonIndex);
  plan.forEach((kind, i) => {
    const seed = lessonIndex * 7 + i;
    const item = rotated[i % rotated.length];
    const id = `${mod.id}-${lessonIndex}-${i}`;
    let step = buildKind(kind, mod, item, seed, id, phrases);
    // Not possible here, or the same kind twice in a row: use a backup.
    if (!step || step.kind === steps.at(-1)?.kind) {
      const backup = FALLBACKS.find((k) => k !== steps.at(-1)?.kind);
      step = buildOne(mod, item, backup, seed, id);
    }
    steps.push(step);
  });

  return mode === "normal" ? withExplain(mod, steps) : steps;
}

// The module quest: a mixed set, harder than a single lesson, covering
// every word of the module.
function buildTest(mod, mode = "standard") {
  const phrases = phrasesOf(mod);
  const isCulture = mod.id.replace(/^[a-z]{2}-/, "").startsWith("c");
  const plan = isCulture
    ? ["meaning", "true-false", "pair-up", "odd-one-out", "match", "true-false"]
    : ["hear-find", "pair-up", "typing", "scramble", "match", "echo"];

  const steps = [];
  plan.forEach((kind, i) => {
    const item = mod.items[i % mod.items.length];
    const id = `${mod.id}-test-${i}`;
    let step = buildKind(kind, mod, item, i + 2, id, phrases);
    if (!step || step.kind === steps.at(-1)?.kind) {
      const backup = FALLBACKS.find((k) => k !== steps.at(-1)?.kind);
      step = buildOne(mod, item, backup, i + 2, id);
    }
    steps.push(step);
  });
  return mode === "normal" ? withExplain(mod, steps) : steps;
}

export { buildLesson, buildTest, GRAMMAR_TIPS };

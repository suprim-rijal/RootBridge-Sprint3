import { languageChapters } from "./language.js";
import { cultureChapters } from "./culture.js";
import { cultureFacts as nepaliFacts } from "./cultureFacts.js";
import finnish from "./languages/finnish.js";
import japanese from "./languages/japanese.js";
import twi from "./languages/twi.js";

const nepaliTracks = [
  {
    id: "language",
    slug: "language",
    title: "Nepali Language",
    nepaliTitle: "नेपाली भाषा",
    tagline:
      "A systematic, cumulative course: sounds, अक्षर, matras, words and stories.",
    motif: "speech bubble and letter",
    chapters: languageChapters,
  },
  {
    id: "culture",
    slug: "culture",
    title: "Discover Nepal",
    nepaliTitle: "नेपाल चिनौँ",
    tagline:
      "A separate, non-hierarchical course about places, people, seasons and celebrations.",
    motif: "woven map",
    chapters: cultureChapters,
  },
];
const nepali = {
  language: "nepali",
  speechLang: "ne-NP",
  greeting: "नमस्ते",
  tracks: nepaliTracks,
  facts: nepaliFacts,
};

// Every language with content. To add one: write ./languages/<name>.js
// and list it here (and set it "active" in languages.js).
const CURRICULA = { nepali, finnish, japanese, twi };

// Tag every track and module with its language (the lesson builder,
// speech and grammar tips use it).
for (const curriculum of Object.values(CURRICULA)) {
  for (const track of curriculum.tracks) {
    track.language = curriculum.language;
    for (const ch of track.chapters)
      for (const m of ch.modules) m.language = curriculum.language;
  }
}

// ---- the learner's active language ----
let activeLanguage = "nepali";
function setActiveLanguage(language) {
  activeLanguage = CURRICULA[language] ? language : "nepali";
}
const getActiveLanguage = () => activeLanguage;
const curriculumFor = (language = activeLanguage) =>
  CURRICULA[language] ?? nepali;

// Kept for Sprint 2 code: the ACTIVE language's tracks.
const activeTracks = () => curriculumFor().tracks;
const everyTrack = Object.values(CURRICULA).flatMap((c) => c.tracks);
const allChapters = everyTrack.flatMap((t) => t.chapters);
const allModules = allChapters.flatMap((c) => c.modules);

// Accepts "language" (the active language) and the API id "finnish-language".
const getTrack = (id = "") => {
  const text = String(id);
  const [prefix, rest] = text.includes("-")
    ? [text.split("-")[0], text.split("-").slice(1).join("-")]
    : [null, text];
  const list =
    prefix && CURRICULA[prefix] ? CURRICULA[prefix].tracks : activeTracks();
  return list.find((t) => t.id === rest || t.slug === rest);
};
const getChapter = (id) => allChapters.find((c) => c.id === id);
const getModule = (id) => allModules.find((mod) => mod.id === id);
const getChapterOfModule = (moduleId) =>
  allChapters.find((c) => c.modules.some((mod) => mod.id === moduleId));
const getTrackOfChapter = (chapterId) =>
  everyTrack.find((t) => t.chapters.some((c) => c.id === chapterId));
// Speech and HTML language codes, for speaking words and for screen readers.
const HTML_LANG = { nepali: "ne", finnish: "fi", japanese: "ja", twi: "ak" };
const speechLangOf = (language = activeLanguage) =>
  curriculumFor(language).speechLang;
const htmlLangOf = (language = activeLanguage) => HTML_LANG[language] ?? "ne";
// The language of a module or lesson id.
const languageOfModule = (moduleId) =>
  getModule(moduleId)?.language ?? "nepali";
const getLesson = (lessonId) => {
  for (const mod of allModules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, module: mod };
  }
  return void 0;
};
const trackModules = (trackId) =>
  (getTrack(trackId)?.chapters ?? []).flatMap((c) => c.modules);
const bridges = [
  {
    id: "b1",
    languagePrereq: "L2 vowels + L3 consonants",
    culturePrereq: "C1 greetings",
    experience:
      "Read signs in an animated neighbourhood and greet three characters.",
    reward: "“First Reader” story card",
  },
  {
    id: "b2",
    languagePrereq: "L6 SOV + adjectives",
    culturePrereq: "C3 regions",
    experience: "Describe two landscapes: हिमाल अग्लो छ।",
    reward: "Map habitat decoration",
  },
  {
    id: "b3",
    languagePrereq: "L7 location postpositions",
    culturePrereq: "C3 provinces",
    experience: "Follow Nepali directions on a province puzzle.",
    reward: "Compass avatar item",
  },
  {
    id: "b4",
    languagePrereq: "L8 respect levels",
    culturePrereq: "C1 etiquette",
    experience: "Choose तिमी / तपाईं in visit and class scenarios.",
    reward: "Respectful Speaker badge",
  },
  {
    id: "b5",
    languagePrereq: "L10 numbers and time",
    culturePrereq: "C2 calendar",
    experience: "Build a year-specific festival calendar from supplied dates.",
    reward: "Calendar wheel",
  },
  {
    id: "b6",
    languagePrereq: "L11 food",
    culturePrereq: "C8 food",
    experience: "Read a fictional menu and compare two family meals.",
    reward: "Recipe story card",
  },
  {
    id: "b7",
    languagePrereq: "L9 conjuncts",
    culturePrereq: "C7 festivals",
    experience: "Decode ल्होसार, पूर्णिमा, सङ्क्रान्ति with component hints.",
    reward: "अक्षर lantern",
  },
  {
    id: "b8",
    languagePrereq: "L12 story",
    culturePrereq: "C10 final project",
    experience: "Narrate four museum cards in Nepali.",
    reward: "Bilingual Curator badge",
  },
];
const badges = [
  {
    id: "matra-maker",
    type: "Skill",
    title: "मात्रा Maker",
    rule: "Strong mastery on all target matras.",
  },
  {
    id: "try-another-way",
    type: "Persistence",
    title: "Try Another Way",
    rule: "Completes a repair path and later retrieves the item. Never based on raw errors.",
  },
  {
    id: "great-question",
    type: "Curiosity",
    title: "Asked a Great Question",
    rule: "Teacher-awarded from a moderated class interaction.",
  },
  {
    id: "respectful-explorer",
    type: "Culture care",
    title: "Respectful Explorer",
    rule: "Uses qualifiers and avoids assumptions across three modules.",
  },
  {
    id: "calendar-connector",
    type: "Connection",
    title: "Calendar Connector",
    rule: "Completes a language–culture bridge.",
  },
  {
    id: "story-builder",
    type: "Creativity",
    title: "Story Builder",
    rule: "Saves a child-created story with the required safety settings.",
  },
  {
    id: "kind-classmate",
    type: "Community",
    title: "Kind Classmate",
    rule: "Teacher-awarded for specific safe behaviour. Never peer voting.",
  },
  {
    id: "language-foundation",
    type: "Milestone",
    title: "Language Foundation",
    rule: "Passes the final language profile criteria.",
  },
  {
    id: "culture-explorer",
    type: "Milestone",
    title: "Culture Explorer",
    rule: "Completes the Nepal learning museum project.",
  },
];
const mechanics = [
  {
    n: 1,
    name: "Hear It, Find It",
    io: "Audio word → tap 1 of 2–6 images",
    skill: "Listening vocabulary",
    scoring: "1.0 first try; 0.7 after replay; 0.4 after a hint.",
  },
  {
    n: 2,
    name: "Picture to Word",
    io: "Image → choose Devanagari word",
    skill: "Reading vocabulary",
    scoring: "Accuracy plus distractor diagnostic.",
  },
  {
    n: 3,
    name: "Memory Pairs",
    io: "Flip word and picture cards",
    skill: "Orthographic recall",
    scoring: "Pair accuracy, no time score.",
  },
  {
    n: 4,
    name: "अक्षर Trail",
    io: "Finger follows the stroke path",
    skill: "Letter formation",
    scoring: "Stroke order, coverage, direction; left-handed mode.",
  },
  {
    n: 5,
    name: "Build the अक्षर",
    io: "Drag consonant + matra pieces",
    skill: "Orthography",
    scoring: "Component choice and attachment scored separately.",
  },
  {
    n: 6,
    name: "Sound Sort",
    io: "Audio token → basket",
    skill: "Phonological discrimination",
    scoring: "At least six trials before inference.",
  },
  {
    n: 7,
    name: "Puff Detective",
    io: "Hear articulation → choose card",
    skill: "Phonology",
    scoring: "Listening is scored; the microphone only visualises.",
  },
  {
    n: 8,
    name: "Echo Studio",
    io: "Model → record → compare",
    skill: "Pronunciation",
    scoring: "Self-reflection and attempts form the evidence.",
  },
  {
    n: 9,
    name: "Sentence Train",
    io: "Tiles → SOV sentence",
    skill: "Syntax",
    scoring: "Partial credit per role zone.",
  },
  {
    n: 10,
    name: "Dialogue Puppets",
    io: "Choose or say the next line",
    skill: "Pragmatics",
    scoring: "Intent, register and form scored separately.",
  },
  {
    n: 11,
    name: "Listen and Do",
    io: "Spoken instruction → move the scene",
    skill: "Listening comprehension",
    scoring: "Object, action and location dimensions.",
  },
  {
    n: 12,
    name: "Story Lantern",
    io: "Narrated story → predict and order",
    skill: "Listening / reading",
    scoring: "Literal, sequence and inference items.",
  },
  {
    n: 13,
    name: "Rhyme Gap",
    io: "Song pauses → choose word or clap",
    skill: "Prosody",
    scoring: "Word fit and beat; no pitch judgment.",
  },
  {
    n: 14,
    name: "Market Basket",
    io: "Request and prices → pay fictional rupees",
    skill: "Numbers",
    scoring: "Item, quantity, price and polite phrase.",
  },
  {
    n: 15,
    name: "Clock Maker",
    io: "Spoken time → set the clock",
    skill: "Time language",
    scoring: "Hour and minute dimensions.",
  },
  {
    n: 16,
    name: "Calendar Wheel",
    io: "Cards → place on a supplied year",
    skill: "Calendar",
    scoring: "Order plus year-specific lookup.",
  },
  {
    n: 17,
    name: "Festival Day Sort",
    io: "Scenes → order the days",
    skill: "Culture sequence",
    scoring: "Credit per correct relation; taught variants accepted.",
  },
  {
    n: 18,
    name: "Respectful Reporter",
    io: "Choose “some / in this story” wording",
    skill: "Cultural literacy",
    scoring: "Qualifier plus no inference plus accuracy.",
  },
  {
    n: 19,
    name: "Map Trek",
    io: "Clue → place a marker",
    skill: "Geography",
    scoring: "Distance-tolerant; keyboard list alternative.",
  },
  {
    n: 20,
    name: "Sound Museum",
    io: "Clip → choose the instrument",
    skill: "Music listening",
    scoring: "Timbre match only; never ethnicity from music.",
  },
  {
    n: 21,
    name: "Pattern Studio",
    io: "Arrange motifs → caption",
    skill: "Art observation",
    scoring: "Pattern principle and attribution.",
  },
  {
    n: 22,
    name: "Spot the Assumption",
    io: "Profile + statements → pick supported facts",
    skill: "Anti-bias reasoning",
    scoring: "Identity inference is corrected explicitly.",
  },
  {
    n: 23,
    name: "Dictation Garden",
    io: "Hear → type, write or assemble",
    skill: "Listening / writing",
    scoring: "अक्षर-level partial credit.",
  },
  {
    n: 24,
    name: "Missing Matra",
    io: "Word with a blank → drag the sign",
    skill: "Decoding",
    scoring: "Matra identity and placement.",
  },
  {
    n: 25,
    name: "Conjunct X-Ray",
    io: "Tap → separate → rebuild",
    skill: "Advanced script",
    scoring: "Components, order, then read the word.",
  },
  {
    n: 26,
    name: "My Mini Book",
    io: "Pictures + 3–8 written pages",
    skill: "Integrated output",
    scoring: "Rubric; private by default.",
  },
  {
    n: 27,
    name: "Teacher Quest",
    io: "Reviewed prompt → child artifact",
    skill: "Transfer",
    scoring: "Teacher rubric mapped to skills.",
  },
  {
    n: 28,
    name: "Offline Adventure Card",
    io: "Real-world noticing → check off",
    skill: "Transfer",
    scoring: "Completion XP; no proof photo required.",
  },
];
const masteryLabels = [
  {
    label: "Seed",
    range: "< 0.45 or fewer than 2 exposures",
    behavior: "Re-model with contrast and concrete support.",
  },
  {
    label: "Growing",
    range: "0.45 – 0.69",
    behavior: "Guided retrieval in same and near-transfer contexts.",
  },
  {
    label: "Ready",
    range: "0.70 – 0.84 with two modalities",
    behavior: "Eligible for the module quest.",
  },
  {
    label: "Strong",
    range: "≥ 0.85 across ≥ 2 sessions",
    behavior: "Counts toward module mastery.",
  },
  {
    label: "Rooted",
    range: "Strong + delayed retrieval after 14 days",
    behavior: "Longer interval; still appears in stories.",
  },
];
const reviewIntervals = [1, 3, 7, 14, 30, 60];
const ageBands = [
  {
    id: "sprouts",
    name: "Sprouts",
    ages: "4–6",
    session: "4–7 min, 4–7 interactions",
    reading: "Spoken instructions, 1–4 words, symbols paired with audio",
    script: "Finger tracing and tile composition",
    ui: "56px+ tap targets, minimal chrome",
  },
  {
    id: "explorers",
    name: "Explorers",
    ages: "7–9",
    session: "7–10 min, 7–12 interactions",
    reading: "1–2 short sentences, romanization on first exposure",
    script: "Trace → copy → guided write",
    ui: "48px+ targets, progress labels",
  },
  {
    id: "pathfinders",
    name: "Pathfinders",
    ages: "10–12",
    session: "10–15 min, 10–18 interactions",
    reading: "Short paragraphs and dialogues, tap-to-reveal romanization",
    script: "Copy → dictation → short composition",
    ui: "44px+ targets, compact skill dashboard",
  },
];
const themes = [
  {
    id: "mountain-sky",
    name: "Mountain Sky",
    desc: "Cool blues and cloud motifs.",
  },
  { id: "forest", name: "Forest", desc: "Green canopy, rhododendron accents." },
  {
    id: "festival-lights",
    name: "Festival Lights",
    desc: "Generic lamps and garlands, rotating decorations.",
  },
  {
    id: "river-valley",
    name: "River Valley",
    desc: "Water, stones and soft teal.",
  },
  {
    id: "calm-paper",
    name: "Calm Paper",
    desc: "Low-stimulation, always available.",
  },
];
export {
  ageBands,
  allChapters,
  allModules,
  badges,
  bridges,
  getChapter,
  getChapterOfModule,
  getLesson,
  getModule,
  getTrack,
  getTrackOfChapter,
  masteryLabels,
  mechanics,
  reviewIntervals,
  themes,
  trackModules,
  // Sprint 3
  CURRICULA,
  curriculumFor,
  setActiveLanguage,
  getActiveLanguage,
  languageOfModule,
  everyTrack,
  speechLangOf,
  htmlLangOf,
};

// The active language's tracks (a live value, not a snapshot).
export { activeTracks };
export const tracks = nepaliTracks; // the Nepali tracks, as in Sprint 2

// World-languages artwork for the login / signup pages.
// A globe with an orbit ring, surrounded by greetings and single letters
// from different writing systems. Not tied to one country, because
// RootBridge will support many heritage languages.
// Pure SVG + HTML + CSS (see ".globe-scene" in styles/flow.css).

// Greetings, each tagged with its language so screen readers pronounce it.
const GREETINGS = [
  { text: "नमस्ते", lang: "ne", label: "Nepali", pos: "g1" },
  { text: "Hola", lang: "es", label: "Spanish", pos: "g2" },
  { text: "你好", lang: "zh", label: "Chinese", pos: "g3" },
  { text: "مرحبا", lang: "ar", label: "Arabic", pos: "g4", rtl: true },
  { text: "Akwaaba", lang: "tw", label: "Twi", pos: "g5" },
  { text: "Привет", lang: "ru", label: "Russian", pos: "g6" },
  { text: "안녕하세요", lang: "ko", label: "Korean", pos: "g7" },
  { text: "Jambo", lang: "sw", label: "Swahili", pos: "g8" },
];

// Single letters that drift in the background (decoration only).
const LETTERS = ["A", "अ", "あ", "가", "ب", "Ж", "Ω", "ሀ", "ñ", "ক", "字", "ß"];

export default function GlobeScene({ className = "" }) {
  return (
    <div className={`globe-scene ${className}`} role="img" aria-label="A globe surrounded by greetings in many languages">
      {LETTERS.map((letter, i) => (
        <span key={letter} className={`drift-letter d${i + 1}`} aria-hidden="true">
          {letter}
        </span>
      ))}

      <svg className="globe-svg" viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          <radialGradient id="globe-fill" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#8FB8E8" />
            <stop offset="55%" stopColor="#3F6FB5" />
            <stop offset="100%" stopColor="#233E78" />
          </radialGradient>
          <clipPath id="globe-clip">
            <circle cx="150" cy="150" r="104" />
          </clipPath>
        </defs>

        <circle cx="150" cy="150" r="104" fill="url(#globe-fill)" />

        {/* simple land shapes */}
        <g clipPath="url(#globe-clip)" fill="#7CC39A" opacity="0.9">
          <path d="M70 92c18-14 44-12 52 2 7 12-6 22-2 34 5 14-10 26-26 22-14-4-12-18-24-24-12-6-14-24 0-34z" />
          <path d="M150 70c20-6 44 0 52 14 6 12-8 16-4 28 3 10 18 10 20 22 2 14-16 22-30 16-12-5-10-20-22-24-14-5-30-4-32-18-2-16 2-32 16-38z" />
          <path d="M128 176c14-4 28 6 30 20 2 16-8 34-22 36-12 2-16-12-14-24 1-10-8-26 6-32z" />
          <path d="M200 176c12-2 24 6 22 18-2 10-14 12-22 8-8-4-12-24 0-26z" />
        </g>

        {/* grid lines */}
        <g clipPath="url(#globe-clip)" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1">
          <ellipse cx="150" cy="150" rx="104" ry="36" />
          <ellipse cx="150" cy="150" rx="104" ry="72" />
          <line x1="40" y1="150" x2="260" y2="150" />
          <ellipse cx="150" cy="150" rx="36" ry="104" />
          <ellipse cx="150" cy="150" rx="72" ry="104" />
          <line x1="150" y1="40" x2="150" y2="260" />
        </g>
        <circle cx="150" cy="150" r="104" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

        {/* orbit ring with a travelling dot */}
        <g className="globe-orbit" transform="rotate(-18 150 150)">
          <ellipse cx="150" cy="150" rx="140" ry="44" fill="none" stroke="#F2B544" strokeWidth="2" strokeDasharray="4 6" />
          <circle className="orbit-dot" r="6" fill="#F2B544">
            <animateMotion dur="10s" repeatCount="indefinite" path="M10 150 a140 44 0 1 0 280 0 a140 44 0 1 0 -280 0" />
          </circle>
        </g>
      </svg>

      {GREETINGS.map((g) => (
        <span key={g.lang} className={`greet-chip ${g.pos}`} aria-hidden="true">
          <b lang={g.lang} dir={g.rtl ? "rtl" : undefined}>
            {g.text}
          </b>
          <small>{g.label}</small>
        </span>
      ))}
    </div>
  );
}

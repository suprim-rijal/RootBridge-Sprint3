// Languages shown in the Language Hub and in the Cultural Passport.
// Only "active" languages can be chosen. To launch one, add its
// curriculum in src/data/languages/, list it in curriculum.js, and
// change its status to "active".

export const LANGUAGES = [
  { id: "nepali", flag: "🇳🇵", name: "Nepali", native: "नेपाली", lang: "ne", region: "Nepal", script: "Devanagari", status: "active" },
  { id: "finnish", flag: "🇫🇮", name: "Finnish", native: "Suomi", lang: "fi", region: "Finland", script: "Latin", status: "active" },
  { id: "japanese", flag: "🇯🇵", name: "Japanese", native: "日本語", lang: "ja", region: "Japan", script: "Kana and kanji", status: "active" },
  { id: "twi", flag: "🇬🇭", name: "Twi", native: "Twi", lang: "ak", region: "Ghana", script: "Latin", status: "active" },
  { id: "yoruba", flag: "🇳🇬", name: "Yoruba", native: "Yorùbá", lang: "yo", region: "Nigeria", script: "Latin", status: "soon" },
  { id: "bengali", flag: "🇧🇩", name: "Bengali", native: "বাংলা", lang: "bn", region: "Bangladesh", script: "Bengali", status: "soon" },
  { id: "hindi", flag: "🇮🇳", name: "Hindi", native: "हिन्दी", lang: "hi", region: "India", script: "Devanagari", status: "soon" },
  { id: "urdu", flag: "🇵🇰", name: "Urdu", native: "اردو", lang: "ur", region: "Pakistan", script: "Arabic", status: "soon", rtl: true },
  { id: "somali", flag: "🇸🇴", name: "Somali", native: "Soomaali", lang: "so", region: "Somalia", script: "Latin", status: "soon" },
];

export const DEFAULT_LANGUAGE = "nepali";
export const getLanguage = (id) => LANGUAGES.find((l) => l.id === id);

// =====================================================================
// Finnish — language + culture courses.
// Content note: culture facts are written in general terms ("many
// families", "often"). Please have a native speaker review before a
// public launch.
// =====================================================================
import { chapter } from "./_build.js";

const P = "fi";

const languageChapters = [
  chapter(P, "language", {
    code: "L1",
    title: "Hello and first sounds",
    nativeTitle: "Tervehdykset ja äänteet",
    summary: "Greet people, answer simple questions and hear the short and long sounds that change Finnish words.",
    modules: [
      {
        code: "L1.1",
        title: "Moi maailma (Hello world)",
        goal: "Greet, give your name, and take two turns in a friendly exchange.",
        lessons: ["Hear greetings in mini-scenes", "Choose the greeting by context", "Say your name", "Two-turn exchange"],
        items: [
          ["Hei", "hei", "hello"],
          ["Moi", "moi", "hi (casual)"],
          ["Kiitos", "kiitos", "thank you"],
          ["Nähdään", "nähdään", "see you"],
          ["Minun nimeni on ___.", "minun nimeni on ___", "my name is ___"],
          ["Mikä sinun nimesi on?", "mikä sinun nimesi on?", "what is your name?"],
        ],
        note: "Finnish has no words for “a” or “the”, and Moi works for both hello and goodbye among friends.",
      },
      {
        code: "L1.2",
        title: "Yes, no and please",
        goal: "Answer yes or no, say please and thank you, and ask how someone is.",
        items: [
          ["Kyllä", "kyllä", "yes"],
          ["Ei", "ei", "no"],
          ["Ole hyvä", "ole hyvä", "please / here you are"],
          ["Anteeksi", "anteeksi", "sorry / excuse me"],
          ["Mitä kuuluu?", "mitä kuuluu?", "how are you?"],
          ["Hyvää, kiitos.", "hyvää, kiitos", "fine, thank you"],
        ],
      },
      {
        code: "L1.3",
        title: "Short and long sounds",
        goal: "Hear and say the difference between a short and a long sound.",
        items: [
          ["tuli", "tu-li", "fire"],
          ["tuuli", "tuu-li", "wind"],
          ["kuka", "ku-ka", "who"],
          ["kukka", "kuk-ka", "flower"],
          ["mato", "ma-to", "worm"],
          ["matto", "mat-to", "rug"],
        ],
        note: "In Finnish, a double letter is held longer, and it changes the word: tuli is fire, tuuli is wind.",
      },
    ],
  }),
  chapter(P, "language", {
    code: "L2",
    title: "Numbers and family",
    nativeTitle: "Numerot ja perhe",
    summary: "Count to ten, name your family, and ask for food and drink.",
    modules: [
      {
        code: "L2.1",
        title: "Numbers 1 to 10",
        goal: "Count to ten and say how many.",
        items: [
          ["yksi", "yk-si", "one"],
          ["kaksi", "kak-si", "two"],
          ["kolme", "kol-me", "three"],
          ["neljä", "nel-jä", "four"],
          ["viisi", "vii-si", "five"],
          ["kuusi", "kuu-si", "six"],
          ["seitsemän", "seit-se-män", "seven"],
          ["kahdeksan", "kah-dek-san", "eight"],
          ["yhdeksän", "yh-dek-sän", "nine"],
          ["kymmenen", "kym-me-nen", "ten"],
        ],
      },
      {
        code: "L2.2",
        title: "My family",
        goal: "Name the people in your family.",
        items: [
          ["perhe", "per-he", "family"],
          ["äiti", "äi-ti", "mother"],
          ["isä", "i-sä", "father"],
          ["sisko", "sis-ko", "sister"],
          ["veli", "ve-li", "brother"],
          ["mummo", "mum-mo", "grandmother"],
          ["Tämä on minun äitini.", "tämä on minun äitini", "this is my mother"],
        ],
      },
      {
        code: "L2.3",
        title: "Food and drink",
        goal: "Name everyday food and ask for something politely.",
        items: [
          ["vesi", "ve-si", "water"],
          ["leipä", "lei-pä", "bread"],
          ["maito", "mai-to", "milk"],
          ["kahvi", "kah-vi", "coffee"],
          ["omena", "o-me-na", "apple"],
          ["Saanko vettä, kiitos?", "saanko vettä, kiitos?", "may I have some water, please?"],
        ],
        note: "Vesi becomes vettä in “Saanko vettä?” — Finnish words change their endings depending on how they are used.",
      },
    ],
  }),
  chapter(P, "language", {
    code: "L3",
    title: "Everyday life",
    nativeTitle: "Arki",
    summary: "Colours, the days of the week, and sentences you can use every day.",
    modules: [
      {
        code: "L3.1",
        title: "Colours",
        goal: "Name the colours around you.",
        items: [
          ["punainen", "pu-nai-nen", "red"],
          ["sininen", "si-ni-nen", "blue"],
          ["valkoinen", "val-koi-nen", "white"],
          ["musta", "mus-ta", "black"],
          ["vihreä", "vih-re-ä", "green"],
          ["keltainen", "kel-tai-nen", "yellow"],
        ],
      },
      {
        code: "L3.2",
        title: "Days of the week",
        goal: "Say the days of the week, today and tomorrow.",
        items: [
          ["maanantai", "maa-nan-tai", "Monday"],
          ["tiistai", "tiis-tai", "Tuesday"],
          ["keskiviikko", "kes-ki-viik-ko", "Wednesday"],
          ["torstai", "tors-tai", "Thursday"],
          ["perjantai", "per-jan-tai", "Friday"],
          ["lauantai", "lau-an-tai", "Saturday"],
          ["sunnuntai", "sun-nun-tai", "Sunday"],
          ["tänään", "tä-nään", "today"],
        ],
        note: "Keskiviikko means “the middle of the week”.",
      },
      {
        code: "L3.3",
        title: "Useful sentences",
        goal: "Introduce yourself and ask for help.",
        items: [
          ["Minä olen ___.", "minä olen ___", "I am ___"],
          ["Minä asun Suomessa.", "minä asun suomessa", "I live in Finland"],
          ["Puhutko englantia?", "puhutko englantia?", "do you speak English?"],
          ["En ymmärrä.", "en ymmärrä", "I do not understand"],
          ["Missä on vessa?", "missä on vessa?", "where is the toilet?"],
        ],
      },
    ],
  }),
];

const cultureChapters = [
  chapter(P, "culture", {
    code: "C1",
    title: "Everyday Finland",
    nativeTitle: "Arkinen Suomi",
    summary: "The sauna, lakes and forests, and the right to roam in nature.",
    modules: [
      {
        code: "C1.1",
        title: "The sauna",
        goal: "Explain what sauna means to many Finnish families.",
        items: [
          ["sauna", "sau-na", "sauna"],
          ["löyly", "löy-ly", "the steam from water thrown on hot stones"],
          ["kiuas", "ki-u-as", "the sauna stove"],
          ["vihta", "vih-ta", "a bundle of birch twigs used in the sauna"],
        ],
        note: "Sauna is one of the best-known Finnish words in the world. Many homes and apartment buildings have one.",
      },
      {
        code: "C1.2",
        title: "Lakes, forests and cottages",
        goal: "Talk about Finnish nature and everyman's right.",
        items: [
          ["järvi", "jär-vi", "lake"],
          ["metsä", "met-sä", "forest"],
          ["marja", "mar-ja", "berry"],
          ["mökki", "mök-ki", "summer cottage"],
          ["jokamiehenoikeus", "jo-ka-mie-hen-oi-keus", "everyman's right: the freedom to walk and pick berries in nature"],
        ],
        note: "Everyman's right lets people walk in most forests and pick berries, with rules that protect homes and crops.",
      },
    ],
  }),
  chapter(P, "culture", {
    code: "C2",
    title: "Celebrations, food and stories",
    nativeTitle: "Juhlat, ruoka ja tarinat",
    summary: "Midsummer and May Day, rye bread and Karelian pies, the Kalevala and the Moomins.",
    modules: [
      {
        code: "C2.1",
        title: "Celebrations",
        goal: "Name the big Finnish celebrations and when they happen.",
        items: [
          ["juhannus", "ju-han-nus", "Midsummer, in late June"],
          ["joulu", "jou-lu", "Christmas"],
          ["vappu", "vap-pu", "May Day, 1 May"],
          ["itsenäisyyspäivä", "it-se-näi-syys-päi-vä", "Independence Day, 6 December"],
        ],
      },
      {
        code: "C2.2",
        title: "Food traditions",
        goal: "Recognise everyday Finnish foods.",
        items: [
          ["ruisleipä", "ruis-lei-pä", "dark rye bread"],
          ["karjalanpiirakka", "kar-ja-lan-pii-rak-ka", "Karelian pie, often filled with rice porridge"],
          ["puuro", "puu-ro", "porridge"],
          ["mustikka", "mus-tik-ka", "blueberry"],
          ["korvapuusti", "kor-va-puus-ti", "cinnamon bun"],
        ],
      },
      {
        code: "C2.3",
        title: "Stories and symbols",
        goal: "Meet the Kalevala, the Moomins, sisu and the northern lights.",
        items: [
          ["Kalevala", "ka-le-va-la", "Finland's national epic poem"],
          ["Muumit", "muu-mit", "the Moomins, created by Tove Jansson"],
          ["sisu", "si-su", "quiet determination that keeps you going"],
          ["revontulet", "re-von-tu-let", "the northern lights"],
        ],
      },
    ],
  }),
];

export default {
  language: "finnish",
  speechLang: "fi-FI",
  greeting: "Hei",
  tracks: [
    {
      id: "language",
      slug: "language",
      title: "Finnish Language",
      nepaliTitle: "Suomen kieli",
      tagline: "Greetings, sounds, numbers, family and everyday sentences, step by step.",
      chapters: languageChapters,
    },
    {
      id: "culture",
      slug: "culture",
      title: "Discover Finland",
      nepaliTitle: "Tutustu Suomeen",
      tagline: "Sauna, lakes and forests, celebrations, food and stories.",
      chapters: cultureChapters,
    },
  ],
  facts: [
    { title: "Sauna", text: "Sauna is a Finnish word used all over the world. Many homes and apartment buildings in Finland have one." },
    { title: "Everyman's right", text: "In Finland, everyone may walk in most forests and pick berries and mushrooms, while respecting homes and nature." },
    { title: "Independence Day", text: "Finland became independent on 6 December 1917. Many families light two candles in the window that evening." },
    { title: "The Moomins", text: "The Moomins, the round white trolls from Moominvalley, were created by the Finnish writer and artist Tove Jansson." },
    { title: "Midsummer", text: "Juhannus is celebrated in late June, when the nights are very light. Many people spend it at a summer cottage by a lake." },
    { title: "The land of lakes", text: "Finland has around 188,000 lakes, which is why it is often called the land of a thousand lakes." },
  ],
};

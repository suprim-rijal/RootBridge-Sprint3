import { chapter } from "./_build.js";

const P = "tw";

const languageChapters = [
  chapter(P, "language", {
    code: "L1",
    title: "Greetings and sounds",
    nativeTitle: "Nkyia ne nnyegyeɛ",
    summary:
      "Welcome people, greet them by the time of day, and meet the letters ɛ and ɔ.",
    modules: [
      {
        code: "L1.1",
        title: "Akwaaba (Welcome)",
        goal: "Greet, give your name, and take two turns in a friendly exchange.",
        lessons: [
          "Hear greetings in mini-scenes",
          "Choose the greeting by the time of day",
          "Say your name",
          "Two-turn exchange",
        ],
        items: [
          ["Akwaaba", "ah-kwaa-ba", "welcome"],
          ["Maakye", "maa-chay", "good morning"],
          ["Maaha", "maa-ha", "good afternoon"],
          ["Maadwo", "maa-jwo", "good evening"],
          ["Ɛte sɛn?", "eh-te sen?", "how are you?"],
          ["Me ho yɛ.", "me ho yeh", "I am fine"],
          ["Yɛfrɛ me ___.", "yeh-freh me ___", "my name is ___"],
        ],
        note: "Twi greetings change with the time of day, like Japanese ones do.",
      },
      {
        code: "L1.2",
        title: "Yes, no and being polite",
        goal: "Answer yes or no, say thank you and sorry, and ask someone's name.",
        items: [
          ["Aane", "aa-ne", "yes"],
          ["Daabi", "daa-bi", "no"],
          ["Medaase", "me-daa-se", "thank you"],
          ["Kafra", "ka-fra", "sorry"],
          ["Mepa wo kyɛw", "me-pa wo chew", "please / excuse me"],
          ["Wo din de sɛn?", "wo din de sen?", "what is your name?"],
        ],
      },
      {
        code: "L1.3",
        title: "The letters ɛ and ɔ",
        goal: "Hear and say the two extra vowels of Twi.",
        items: [
          ["ɛna", "eh-na", "mother"],
          ["ɔba", "aw-ba", "child"],
          ["ɔdɔ", "aw-daw", "love"],
          ["fie", "fi-e", "home"],
          ["ɛnnɛ", "eh-neh", "today"],
          ["nsuo", "n-su-o", "water"],
        ],
        note: "ɛ sounds like the e in “bed”, and ɔ like the o in “hot”. Tone matters too: the same letters said with a different pitch can be a different word.",
      },
    ],
  }),
  chapter(P, "language", {
    code: "L2",
    title: "Numbers and family",
    nativeTitle: "Nkontabuo ne abusua",
    summary: "Count to ten, name your family, and ask for food and drink.",
    modules: [
      {
        code: "L2.1",
        title: "Numbers 1 to 10",
        goal: "Count to ten in Twi.",
        items: [
          ["baako", "baa-ko", "one"],
          ["mmienu", "mmye-nu", "two"],
          ["mmiɛnsa", "mmyen-sa", "three"],
          ["ɛnan", "eh-nan", "four"],
          ["enum", "e-num", "five"],
          ["nsia", "n-sia", "six"],
          ["nson", "n-son", "seven"],
          ["nwɔtwe", "nwaw-chwe", "eight"],
          ["nkron", "n-kron", "nine"],
          ["du", "du", "ten"],
        ],
      },
      {
        code: "L2.2",
        title: "My family",
        goal: "Name the people in your family.",
        items: [
          ["abusua", "a-bu-sua", "family / clan"],
          ["maame", "maa-me", "mum"],
          ["papa", "pa-pa", "dad"],
          ["nua", "nu-a", "brother or sister"],
          ["nana", "na-na", "grandparent"],
          ["Yei ne me maame.", "yei ne me maa-me", "this is my mum"],
        ],
        note: "In Akan tradition the abusua (clan) is passed down through the mother's family.",
      },
      {
        code: "L2.3",
        title: "Food and the market",
        goal: "Name everyday food and ask for something politely.",
        items: [
          ["aduane", "a-dua-ne", "food"],
          ["fufuo", "fu-fu-o", "fufu, a pounded dish eaten with soup"],
          ["nkate", "n-ka-te", "groundnuts (peanuts)"],
          ["dwaso", "jwa-so", "market"],
          [
            "Mepa wo kyɛw, ma me nsuo.",
            "me-pa wo chew, ma me n-su-o",
            "please, give me some water",
          ],
        ],
      },
    ],
  }),
  chapter(P, "language", {
    code: "L3",
    title: "Everyday life",
    nativeTitle: "Da biara asetena",
    summary:
      "Colours, the days of the week, and sentences you can use every day.",
    modules: [
      {
        code: "L3.1",
        title: "Colours",
        goal: "Name the colours around you.",
        items: [
          ["kɔkɔɔ", "kaw-kaw", "red"],
          ["tuntum", "tun-tum", "black"],
          ["fitaa", "fi-taa", "white"],
          ["ahabammono", "a-ha-bam-mo-no", "green"],
          ["akokɔsrade", "a-ko-kaw-sra-de", "yellow"],
        ],
      },
      {
        code: "L3.2",
        title: "Days of the week",
        goal: "Say the days of the week.",
        items: [
          ["Kwasiada", "kwa-si-a-da", "Sunday"],
          ["Dwoada", "jwo-a-da", "Monday"],
          ["Benada", "be-na-da", "Tuesday"],
          ["Wukuada", "wu-ku-a-da", "Wednesday"],
          ["Yawoada", "ya-wo-a-da", "Thursday"],
          ["Fiada", "fi-a-da", "Friday"],
          ["Memeneda", "me-me-ne-da", "Saturday"],
        ],
        note: "Akan day names are linked to personal names: a boy born on Friday (Fiada) is often called Kofi.",
      },
      {
        code: "L3.3",
        title: "Useful sentences",
        goal: "Say where you are going and ask for help.",
        items: [
          ["Me din de ___.", "me din de ___", "my name is ___"],
          ["Me kɔ sukuu.", "me kaw su-kuu", "I am going to school"],
          ["Mennte aseɛ.", "men-te a-seh", "I do not understand"],
          ["Boa me.", "bo-a me", "help me"],
        ],
      },
    ],
  }),
];

const cultureChapters = [
  chapter(P, "culture", {
    code: "C1",
    title: "Names and symbols",
    nativeTitle: "Din ne nsɛnkyerɛnne",
    summary: "Day names, kente cloth and Adinkra symbols.",
    modules: [
      {
        code: "C1.1",
        title: "Day names",
        goal: "Explain how many Akan children are named after the day they were born.",
        items: [
          ["Kofi", "ko-fi", "a boy born on Friday"],
          ["Ama", "a-ma", "a girl born on Saturday"],
          ["Kwame", "kwa-me", "a boy born on Saturday"],
          ["Akosua", "a-ko-su-a", "a girl born on Sunday"],
          ["Yaa", "yaa", "a girl born on Thursday"],
          ["Kwaku", "kwa-ku", "a boy born on Wednesday"],
        ],
      },
      {
        code: "C1.2",
        title: "Kente and Adinkra",
        goal: "Recognise kente cloth and a few Adinkra symbols.",
        items: [
          ["kente", "ken-te", "a handwoven cloth with bright patterns"],
          ["Adinkra", "a-din-kra", "symbols that each carry a meaning"],
          [
            "Gye Nyame",
            "jeh nya-me",
            "an Adinkra symbol about the power of God",
          ],
          ["Sankofa", "san-ko-fa", "an Adinkra symbol: learn from the past"],
        ],
      },
    ],
  }),
  chapter(P, "culture", {
    code: "C2",
    title: "Stories, food and festivals",
    nativeTitle: "Anansesɛm, aduane ne afahyɛ",
    summary:
      "Ananse the spider, talking drums, jollof and kelewele, festivals and cities.",
    modules: [
      {
        code: "C2.1",
        title: "Stories and music",
        goal: "Meet Ananse and the drums and music of Ghana.",
        items: [
          ["Ananse", "a-nan-se", "the clever spider of Akan folk tales"],
          ["Anansesɛm", "a-nan-se-sem", "Ananse stories"],
          [
            "atumpan",
            "a-tum-pan",
            "talking drums that copy the tones of speech",
          ],
          ["highlife", "high-life", "a popular Ghanaian music style"],
        ],
      },
      {
        code: "C2.2",
        title: "Food traditions",
        goal: "Recognise everyday Ghanaian dishes.",
        items: [
          ["jollof", "jol-lof", "rice cooked in a spicy tomato sauce"],
          ["kelewele", "ke-le-we-le", "spiced fried plantain"],
          ["nkatenkwan", "n-ka-te-nkwan", "groundnut (peanut) soup"],
          ["waakye", "waa-chay", "rice and beans cooked together"],
        ],
      },
      {
        code: "C2.3",
        title: "Festivals and places",
        goal: "Name a few Ghanaian festivals and cities.",
        items: [
          [
            "Akwasidae",
            "a-kwa-si-dae",
            "an Akan festival held on a Sunday, every six weeks",
          ],
          ["Odwira", "o-jwi-ra", "a harvest and cleansing festival"],
          [
            "Kumasi",
            "ku-ma-si",
            "a major city, the historic seat of the Asante kingdom",
          ],
          ["Accra", "ak-kra", "Accra, the capital of Ghana"],
        ],
      },
    ],
  }),
];

export default {
  language: "twi",
  speechLang: "ak-GH", // browsers rarely have a Twi voice: the English fallback is used
  greeting: "Akwaaba",
  tracks: [
    {
      id: "language",
      slug: "language",
      title: "Twi Language",
      nepaliTitle: "Twi kasa",
      tagline:
        "Greetings, sounds, numbers, family and everyday sentences, step by step.",
      chapters: languageChapters,
    },
    {
      id: "culture",
      slug: "culture",
      title: "Discover Ghana",
      nepaliTitle: "Ghana amammerɛ",
      tagline:
        "Day names, kente and Adinkra, Ananse stories, food and festivals.",
      chapters: cultureChapters,
    },
  ],
  facts: [
    {
      title: "Day names",
      text: "Many Akan children receive a name linked to the day they were born. Kofi, for example, is a boy born on a Friday.",
    },
    {
      title: "Kente",
      text: "Kente is a handwoven cloth made in strips, with bright patterns. It is often worn on special occasions.",
    },
    {
      title: "Sankofa",
      text: "Sankofa is an Adinkra symbol, often shown as a bird looking back. It means: learn from the past.",
    },
    {
      title: "Ananse",
      text: "Ananse the clever spider is the hero of many Akan folk tales, told across Ghana and beyond.",
    },
    {
      title: "Accra",
      text: "Accra, on the Atlantic coast, is the capital of Ghana.",
    },
    {
      title: "Talking drums",
      text: "Because Twi uses tone, talking drums called atumpan can copy the rise and fall of spoken words.",
    },
  ],
};

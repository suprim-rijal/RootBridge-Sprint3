import { chapter } from "./_build.js";

const P = "ja";

const languageChapters = [
  chapter(P, "language", {
    code: "L1",
    title: "Greetings and sounds",
    nativeTitle: "あいさつ と おと",
    summary:
      "Greet people at any time of day, be polite, and hear long and short vowels.",
    modules: [
      {
        code: "L1.1",
        title: "Konnichiwa (Hello world)",
        goal: "Greet, give your name, and take two turns in a friendly exchange.",
        lessons: [
          "Hear greetings in mini-scenes",
          "Choose the greeting by the time of day",
          "Say your name",
          "Two-turn exchange",
        ],
        items: [
          ["こんにちは", "konnichiwa", "hello / good afternoon"],
          ["おはよう ございます", "ohayō gozaimasu", "good morning (polite)"],
          ["こんばんは", "konbanwa", "good evening"],
          ["さようなら", "sayōnara", "goodbye"],
          [
            "わたし は ___ です。",
            "watashi wa ___ desu",
            "I am ___ / my name is ___",
          ],
          ["おなまえ は？", "onamae wa?", "what is your name?"],
        ],
        note: "Japanese greetings change with the time of day: ohayō in the morning, konnichiwa in the daytime, konbanwa in the evening.",
      },
      {
        code: "L1.2",
        title: "Yes, no and being polite",
        goal: "Answer yes or no, say thank you, and use polite words.",
        items: [
          ["はい", "hai", "yes"],
          ["いいえ", "iie", "no"],
          ["ありがとう", "arigatō", "thank you"],
          ["すみません", "sumimasen", "excuse me / sorry"],
          ["おねがいします", "onegaishimasu", "please"],
          ["はじめまして", "hajimemashite", "nice to meet you"],
        ],
        note: "Adding gozaimasu makes thanks more polite: arigatō gozaimasu.",
      },
      {
        code: "L1.3",
        title: "Long and short vowels",
        goal: "Hear and say the difference between a short and a long vowel.",
        items: [
          ["おばさん", "obasan", "aunt"],
          ["おばあさん", "obāsan", "grandmother"],
          ["おじさん", "ojisan", "uncle"],
          ["おじいさん", "ojīsan", "grandfather"],
          ["ゆき", "yuki", "snow"],
          ["ゆうき", "yūki", "courage"],
        ],
        note: "A long vowel is held for twice as long, and it changes the word: obasan is aunt, obāsan is grandmother.",
      },
    ],
  }),
  chapter(P, "language", {
    code: "L2",
    title: "Numbers and family",
    nativeTitle: "かず と かぞく",
    summary: "Count to ten, name your family, and ask for food and drink.",
    modules: [
      {
        code: "L2.1",
        title: "Numbers 1 to 10",
        goal: "Count to ten in Japanese.",
        items: [
          ["いち", "ichi", "one"],
          ["に", "ni", "two"],
          ["さん", "san", "three"],
          ["よん", "yon", "four", "Four can also be read shi."],
          ["ご", "go", "five"],
          ["ろく", "roku", "six"],
          ["なな", "nana", "seven", "Seven can also be read shichi."],
          ["はち", "hachi", "eight"],
          ["きゅう", "kyū", "nine"],
          ["じゅう", "jū", "ten"],
        ],
      },
      {
        code: "L2.2",
        title: "My family",
        goal: "Name the people in a family.",
        items: [
          ["かぞく", "kazoku", "family"],
          ["おかあさん", "okāsan", "mother"],
          ["おとうさん", "otōsan", "father"],
          ["おねえさん", "onēsan", "older sister"],
          ["おにいさん", "onīsan", "older brother"],
          [
            "これ は わたし の かぞく です。",
            "kore wa watashi no kazoku desu",
            "this is my family",
          ],
        ],
        note: "Japanese uses different words for your own family and other people's. Okāsan is the polite word for a mother.",
      },
      {
        code: "L2.3",
        title: "Food and drink",
        goal: "Name everyday food and ask for something politely.",
        items: [
          ["ごはん", "gohan", "rice / a meal"],
          ["みず", "mizu", "water"],
          ["おちゃ", "ocha", "tea"],
          ["さかな", "sakana", "fish"],
          ["おいしい", "oishii", "delicious"],
          ["みず を ください。", "mizu o kudasai", "water, please"],
        ],
      },
    ],
  }),
  chapter(P, "language", {
    code: "L3",
    title: "Everyday life",
    nativeTitle: "まいにち",
    summary:
      "Colours, the days of the week, and sentences you can use every day.",
    modules: [
      {
        code: "L3.1",
        title: "Colours",
        goal: "Name the colours around you.",
        items: [
          ["あか", "aka", "red"],
          ["あお", "ao", "blue"],
          ["しろ", "shiro", "white"],
          ["くろ", "kuro", "black"],
          ["きいろ", "kiiro", "yellow"],
          ["みどり", "midori", "green"],
        ],
      },
      {
        code: "L3.2",
        title: "Days of the week",
        goal: "Say the days of the week, today and tomorrow.",
        items: [
          ["げつようび", "getsuyōbi", "Monday"],
          ["かようび", "kayōbi", "Tuesday"],
          ["すいようび", "suiyōbi", "Wednesday"],
          ["もくようび", "mokuyōbi", "Thursday"],
          ["きんようび", "kin'yōbi", "Friday"],
          ["どようび", "doyōbi", "Saturday"],
          ["にちようび", "nichiyōbi", "Sunday"],
          ["きょう", "kyō", "today"],
        ],
        note: "Every weekday ends in -yōbi. The first part comes from the moon, fire, water, wood, gold, earth and the sun.",
      },
      {
        code: "L3.3",
        title: "Useful sentences",
        goal: "Introduce yourself and ask for help.",
        items: [
          ["わかりません。", "wakarimasen", "I do not understand"],
          [
            "えいご を はなせます か？",
            "eigo o hanasemasu ka?",
            "can you speak English?",
          ],
          [
            "トイレ は どこ です か？",
            "toire wa doko desu ka?",
            "where is the toilet?",
          ],
          [
            "わたし は ___ に すんで います。",
            "watashi wa ___ ni sunde imasu",
            "I live in ___",
          ],
        ],
        note: "Ka at the end of a sentence turns it into a question.",
      },
    ],
  }),
];

const cultureChapters = [
  chapter(P, "culture", {
    code: "C1",
    title: "Everyday Japan",
    nativeTitle: "にほん の くらし",
    summary: "Three ways of writing, and manners at home and at the table.",
    modules: [
      {
        code: "C1.1",
        title: "Three writing systems",
        goal: "Explain why Japanese uses three sets of characters together.",
        items: [
          ["ひらがな", "hiragana", "the rounded script for Japanese words"],
          [
            "カタカナ",
            "katakana",
            "the angular script, often for words from other languages",
          ],
          ["漢字", "kanji", "characters that came from Chinese"],
          ["ローマ字", "rōmaji", "Japanese written in Latin letters"],
        ],
        note: "One Japanese sentence can use hiragana, katakana and kanji together. Children usually learn hiragana first.",
      },
      {
        code: "C1.2",
        title: "Home and manners",
        goal: "Describe a few everyday customs at home.",
        items: [
          ["げんかん", "genkan", "the entrance where shoes come off"],
          ["おじぎ", "ojigi", "a bow"],
          ["はし", "hashi", "chopsticks"],
          ["たたみ", "tatami", "a floor mat made of woven straw"],
        ],
      },
    ],
  }),
  chapter(P, "culture", {
    code: "C2",
    title: "Seasons, food and places",
    nativeTitle: "きせつ と たべもの",
    summary:
      "Cherry blossoms and New Year, lunch boxes and rice balls, mountains and hot springs.",
    modules: [
      {
        code: "C2.1",
        title: "Seasons and festivals",
        goal: "Name the big seasonal events.",
        items: [
          ["はなみ", "hanami", "cherry-blossom viewing in spring"],
          ["おしょうがつ", "oshōgatsu", "the New Year holiday"],
          ["なつまつり", "natsumatsuri", "a summer festival"],
          ["こどもの ひ", "kodomo no hi", "Children's Day, 5 May"],
        ],
      },
      {
        code: "C2.2",
        title: "Food culture",
        goal: "Recognise everyday Japanese meals.",
        items: [
          ["おべんとう", "obentō", "a packed lunch box"],
          ["おにぎり", "onigiri", "a rice ball, often with a filling"],
          ["みそしる", "misoshiru", "miso soup"],
          ["すし", "sushi", "sushi"],
        ],
      },
      {
        code: "C2.3",
        title: "Places and nature",
        goal: "Name well-known places and natural features.",
        items: [
          ["ふじさん", "Fujisan", "Mount Fuji, Japan's highest mountain"],
          ["おんせん", "onsen", "a natural hot spring"],
          ["しま", "shima", "island"],
          ["とうきょう", "Tōkyō", "Tokyo, the capital"],
        ],
      },
    ],
  }),
];

export default {
  language: "japanese",
  speechLang: "ja-JP",
  greeting: "こんにちは",
  tracks: [
    {
      id: "language",
      slug: "language",
      title: "Japanese Language",
      nepaliTitle: "にほんご",
      tagline:
        "Greetings, sounds, numbers, family and everyday sentences, step by step.",
      chapters: languageChapters,
    },
    {
      id: "culture",
      slug: "culture",
      title: "Discover Japan",
      nepaliTitle: "にほん を しろう",
      tagline: "Writing, manners at home, seasons, food and places.",
      chapters: cultureChapters,
    },
  ],
  facts: [
    {
      title: "Three scripts",
      text: "Japanese uses hiragana, katakana and kanji together — sometimes all three in one sentence.",
    },
    {
      title: "Shoes off",
      text: "In many Japanese homes, shoes come off at the genkan, the small step by the front door.",
    },
    {
      title: "Hanami",
      text: "In spring, many people gather under cherry trees for hanami, to enjoy the blossoms together.",
    },
    {
      title: "Mount Fuji",
      text: "Mount Fuji is Japan's highest mountain, at 3,776 metres. It is a volcano.",
    },
    {
      title: "Children's Day",
      text: "On 5 May, many families fly colourful carp-shaped streamers called koinobori for Children's Day.",
    },
    {
      title: "Itadakimasu",
      text: "Many people say itadakimasu before eating, as a thank you for the food.",
    },
  ],
};

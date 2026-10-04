import { Volume2 } from "lucide-react";
import { htmlLangOf, speechLangOf } from "../../../data/curriculum.js";
import { wordOfTheDay } from "../../../lib/learningSummary.js";
import { speakWord } from "../../../lib/speech.js";

// Widget 3: one Nepali word a day (from the language curriculum).
export default function WordOfTheDay() {
  const word = wordOfTheDay();
  return (
    <section className="widget widget-word" aria-labelledby="w-word">
      <h2 id="w-word" className="widget-title">
        Word of the day
      </h2>
      <div className="word-row">
        <span className="word-np" lang={htmlLangOf()}>
          {word.np}
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={() =>
            speakWord(word.np, { lang: speechLangOf(), englishFallback: `${word.rom}. It means ${word.en}.` })
          }
          aria-label={`Hear ${word.rom}`}
        >
          <Volume2 size={18} />
        </button>
      </div>
      <p className="word-rom">{word.rom}</p>
      <p className="word-en">“{word.en}”</p>
    </section>
  );
}

import { Landmark } from "lucide-react";
import { factOfTheDay } from "../../../lib/learningSummary.js";

// Widget 4: a new culture fact every day.
export default function CulturalFact() {
  const fact = factOfTheDay();
  return (
    <section className="widget widget-fact" aria-labelledby="w-fact">
      <h2 id="w-fact" className="widget-title">
        <Landmark size={16} aria-hidden="true" /> Cultural fact
      </h2>
      <p className="fact-title">{fact.title}</p>
      <p className="fact-text">{fact.text}</p>
      <p className="widget-muted">A new fact every day.</p>
    </section>
  );
}

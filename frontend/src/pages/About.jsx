import { Book, Heart, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1 className="h-display">Discovering Who We Are</h1>
        <div className="tagline">
          Heritage learning custom-crafted for the next generation.
        </div>
      </div>

      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          For families growing up away from their countries of origin, culture
          and language are more than items on a page—they are lines of
          connection to grandparents, cousins, and ancestral history. RootBridge
          was created to make heritage language learning engaging, interactive,
          and personalized, allowing children to learn comfortably at their own
          pace.
        </p>
      </div>

      <div className="about-section">
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Globe /> Core pillars
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "20px",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--terracotta)",
              }}
            >
              <Heart size={18} /> Love for Heritage
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "14.5px",
                color: "var(--ink-soft)",
              }}
            >
              We go beyond grammar to teach tales, proverbs, recipes, and
              seasonal geography.
            </p>
          </div>
          <div>
            <h4
              style={{
                margin: "0 0 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--indigo)",
              }}
            >
              <Book size={18} /> Game-like Focus
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "14.5px",
                color: "var(--ink-soft)",
              }}
            >
              Bite-sized speaking prompts and matching mini-games turn learning
              into daily play.
            </p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Active Support</h2>
        <p>
          RootBridge provides lessons in Twi (Ghana), Yoruba (Nigeria), and
          Nepali. Additional languages are currently in active design,
          prioritizing high-immersion cultural passbooks.
        </p>
      </div>
    </div>
  );
}

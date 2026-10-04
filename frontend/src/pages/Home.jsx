import { Link } from "react-router-dom";
import { LANGUAGES } from "../data/languages.js";
import { BookOpen, Map, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            🌍 Heritage learning, one family at a time
          </div>
          <h1 className="h-display">
            Learn your language.
            <br />
            Discover your <em>culture</em>.<br />
            Stay connected to your roots.
          </h1>
          <p>
            Interactive language and cultural learning tailored for children
            growing up away from their family's country of origin. Bridge the
            generation gap with engaging, bite-sized lessons.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary">
              Start Learning
            </Link>
            <Link to="/login" className="btn btn-ghost">
              I have an account
            </Link>
          </div>

          <div className="lang-pill-row">
            {/* Read from data/languages.js: available ones link to signup */}
            {LANGUAGES.map((l) =>
              l.status === "active" ? (
                <Link key={l.id} to="/signup" className="lang-pill live">
                  {l.flag} {l.region} — {l.name} available
                </Link>
              ) : (
                <span key={l.id} className="lang-pill">
                  {l.flag} {l.region} — {l.name} coming soon
                </span>
              ),
            )}
          </div>
        </div>

        {/* Animated hero art with transparent background */}
        <div className="hero-art">
          {/* LANE 1: Left ~2% */}
          <div
            className="welcome-word featured"
            style={{
              left: "2%",
              animationDelay: "0s",
              color: "var(--gold-deep)",
            }}
          >
            Akwaaba<span className="lang">Twi · Ghana</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "5%",
              animationDelay: "-7s",
              color: "var(--terracotta)",
            }}
          >
            Káàbọ̀<span className="lang">Yoruba · Nigeria</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "0%",
              animationDelay: "-14s",
              color: "var(--indigo)",
            }}
          >
            Swagat Cha<span className="lang">Nepali · Nepal</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "10%",
              animationDelay: "-21s",
              color: "var(--indigo)",
            }}
          >
            ¡Hola!<span className="lang">Spanish · Spain</span>
          </div>

          {/* LANE 2: Left ~28% */}
          <div
            className="welcome-word"
            style={{
              left: "28%",
              animationDelay: "-2s",
              color: "var(--terracotta)",
              fontSize: "20px",
            }}
          >
            Khush Aamdeed<span className="lang">Urdu · Pakistan</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "25%",
              animationDelay: "-9s",
              color: "var(--gold-deep)",
            }}
          >
            Shagotom<span className="lang">Bengali · Bangladesh</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "30%",
              animationDelay: "-16s",
              color: "var(--indigo)",
            }}
          >
            Chào mừng<span className="lang">Vietnamese · Vietnam</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "15%",
              animationDelay: "-23s",
              color: "var(--indigo)",
            }}
          >
            Konnichiwa<span className="lang">Japanese · Japan</span>
          </div>

          {/* LANE 3: Left ~50% */}
          <div
            className="welcome-word"
            style={{
              left: "35%",
              animationDelay: "-4s",
              color: "var(--terracotta)",
              fontSize: "18px",
            }}
          >
            Maligayang Pagdating
            <span className="lang">Filipino · Philippines</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "50%",
              animationDelay: "-11s",
              color: "var(--indigo)",
              fontSize: "18px",
            }}
          >
            Enkuan Dehna Metu<span className="lang">Amharic · Ethiopia</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "45%",
              animationDelay: "-18s",
              color: "var(--gold-deep)",
              fontSize: "18px",
            }}
          >
            Soo Dhawoow<span className="lang">Somali · Somalia</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "40%",
              animationDelay: "-25s",
              color: "var(--gold-deep)",
              fontSize: "18px",
            }}
          >
            Bem-vindo<span className="lang">Brazilian · Brazil</span>
          </div>

          {/* LANE 4: Left ~75% */}
          <div
            className="welcome-word"
            style={{
              left: "75%",
              animationDelay: "-6s",
              color: "var(--green)",
            }}
          >
            Bienvenido<span className="lang">Spanish</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "68%",
              animationDelay: "-13s",
              color: "var(--green)",
            }}
          >
            Swagat Hai<span className="lang">Hindi · India</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "65%",
              animationDelay: "-20s",
              color: "var(--terracotta)",
              fontSize: "20px",
            }}
          >
            Bienvenue<span className="lang">French</span>
          </div>
          <div
            className="welcome-word"
            style={{
              left: "60%",
              animationDelay: "-27s",
              color: "var(--terracotta)",
              fontSize: "20px",
            }}
          >
            Tervetuloa<span className="lang">Finnish · Finland</span>
          </div>
        </div>
      </section>

      {/* Explanations Section */}
      <section id="explanations" className="explanations">
        <div className="section-head">
          <h2 className="h-display">Why Families Love RootBridge</h2>
          <p>
            We combine game-like language lessons with rich cultural context to
            make learning heritage keys exciting.
          </p>
        </div>

        <div className="features">
          <div className="feature-card" style={{ color: "var(--indigo)" }}>
            <div className="icon" style={{ background: "var(--indigo-soft)" }}>
              <BookOpen />
            </div>
            <h3>Gamified Learning</h3>
            <p>
              Bite-sized visual vocabulary cards, interactive matching tile
              games, audio speech exercises, and quizzes designed to keep
              children engaged for 10-15 minutes a day.
            </p>
            <Link to="/signup" className="learn-more">
              Start a lesson <ArrowRight size={16} />
            </Link>
          </div>

          <div className="feature-card" style={{ color: "var(--terracotta)" }}>
            <div
              className="icon"
              style={{ background: "var(--terracotta-soft)" }}
            >
              <Map />
            </div>
            <h3>Cultural Passports</h3>
            <p>
              Explore geography, traditions, historical values, and seasonal
              festivals. Unlock decorative digital stamps as you complete
              lessons and map your family journey.
            </p>
            <Link to="/signup" className="learn-more">
              See the learning paths <ArrowRight size={16} />
            </Link>
          </div>

          <div className="feature-card" style={{ color: "var(--gold-deep)" }}>
            <div className="icon" style={{ background: "var(--gold-soft)" }}>
              <Users />
            </div>
            <h3>Mixed-Heritage Pathways</h3>
            <p>
              Perfect for children of diverse heritage backgrounds. Families can
              customize their learning goals, select multiple paths, and manage
              child progress in one dashboard.
            </p>
            <Link to="/signup" className="learn-more">
              Set Goals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

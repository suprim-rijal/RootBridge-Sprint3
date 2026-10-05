import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Globe2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { LANGUAGES } from "../../data/languages.js";
import { curriculumFor } from "../../data/curriculum.js";

// /choose-language — the Language Hub (Sprint 3).
// Shown once, after signup and before the welcome animation. The choice
// can be changed later in the Cultural Passport or the profile.
const count = (track) => {
  const modules = track.chapters.flatMap((c) => c.modules);
  return { modules: modules.length, lessons: modules.reduce((n, m) => n + m.lessons.length, 0) };
};

export default function ChooseLanguage() {
  const navigate = useNavigate();
  const { setLanguage, isFamily, learnerName } = useAuth();
  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const choices = LANGUAGES.filter((l) => l.status === "active").map((lang) => {
    const tracks = curriculumFor(lang.id).tracks;
    return { ...lang, language: tracks.find((t) => t.id === "language"), culture: tracks.find((t) => t.id === "culture") };
  });
  const soon = LANGUAGES.filter((l) => l.status !== "active");

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    setError("");
    try {
      await setLanguage(picked);
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="hub">
      <p className="hub-kicker">
        <Globe2 size={16} aria-hidden="true" /> Language Hub
      </p>
      <h1 className="hub-title">{isFamily ? `Which language will ${learnerName} learn?` : "Which language will you learn?"}</h1>
      <p className="hub-sub">Each one has a language path and a culture path. You can change it later.</p>

      <div className="hub-grid" role="radiogroup" aria-label="Language">
        {choices.map((c) => {
          const lang = count(c.language);
          const cult = count(c.culture);
          const selected = picked === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`hub-card ${selected ? "selected" : ""}`}
              onClick={() => setPicked(c.id)}
            >
              <span className="hub-native" lang={c.lang}>
                {c.native}
              </span>
              <span className="hub-name">
                {c.name} <small>· {c.region}</small>
              </span>
              <span className="hub-tracks">
                <span>
                  <b>{c.language.title}</b> — {lang.modules} modules, {lang.lessons} lessons
                </span>
                <span>
                  <b>{c.culture.title}</b> — {cult.modules} modules, {cult.lessons} lessons
                </span>
              </span>
              {selected ? (
                <span className="hub-check" aria-hidden="true">
                  <Check size={16} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {soon.length ? (
        <p className="hub-soon">
          Coming soon: {soon.map((l) => l.name).join(", ")}.
        </p>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="btn btn-dark hub-continue" onClick={save} disabled={!picked || saving}>
        {saving ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}

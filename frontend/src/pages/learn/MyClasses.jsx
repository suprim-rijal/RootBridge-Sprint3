import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, FileText, GraduationCap, Video } from "lucide-react";
import JoinClassCard from "../../components/JoinClassCard.jsx";
import FindClass from "../../components/FindClass.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { downloadMaterial, myClasses } from "../../services/api.js";
import { getLesson } from "../../data/curriculum.js";
import { trackOf, useProgress } from "../../lib/progress.js";

// /classes — a learner's classes (Sprint 3 Step 6).
// Join with a teacher's code, open the live lesson, see homework and
// download the teacher's materials.
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";

export default function MyClasses() {
  const { user, isFamily, learnerName } = useAuth();
  const { state } = useProgress();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState("");

  // Reload whenever the list of joined classes changes (join / leave).
  const joined = user.details.classes.map((c) => c.code).join(",");
  useEffect(() => {
    let alive = true;
    myClasses()
      .then((res) => alive && setClasses(res.data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [joined]);

  // The next lesson of a homework task that is not finished yet.
  const nextLesson = (a) => {
    const id = a.lessonIds.find((l) => !state.completedLessons.includes(l)) ?? a.lessonIds[0];
    const found = id ? getLesson(id) : null;
    return found ? `/learn/${trackOf(found.module.id)}/lesson/${id}` : null;
  };

  return (
    <div className="acct classes-page">
      <header className="acct-head">
        <p className="pd-eyebrow">
          <GraduationCap size={14} aria-hidden="true" /> My classes
        </p>
        <h1>{isFamily ? `${learnerName}'s classes` : "Your classes"}</h1>
      </header>

      <JoinClassCard />
      <FindClass />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {classes === null && !error ? <p className="pd-empty">Loading your classes…</p> : null}

      {classes?.map((c) => (
        <section key={c.id} className="pd-panel class-card" aria-labelledby={`class-${c.id}`}>
          <header className="class-card-head">
            <div>
              <h2 id={`class-${c.id}`}>{c.name}</h2>
              <p className="pd-footnote">
                {c.teacher}
                {c.meets ? ` · ${c.meets}` : ""}
              </p>
            </div>
            {c.liveClassUrl ? (
              <a className="btn btn-green btn-sm" href={c.liveClassUrl} target="_blank" rel="noopener noreferrer">
                <Video size={16} aria-hidden="true" /> Join live class
              </a>
            ) : null}
          </header>

          <h3>
            <BookOpen size={15} aria-hidden="true" /> Homework
          </h3>
          {c.assignments.length ? (
            <ul className="t-list">
              {c.assignments.map((a) => {
                const to = nextLesson(a);
                return (
                  <li key={a.id} className={a.done ? "done" : ""}>
                    <div>
                      <b>
                        {a.done ? <CheckCircle2 size={15} className="ic-done" aria-label="Done" /> : null} {a.title}
                      </b>
                      <small>
                        {a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No due date"}
                        {a.done ? " · done" : ""}
                      </small>
                      {a.instructions ? <p>{a.instructions}</p> : null}
                    </div>
                    {to && !a.done ? (
                      <Link to={to} className="btn btn-primary btn-sm">
                        Start
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="pd-empty">No homework right now.</p>
          )}

          <h3>
            <FileText size={15} aria-hidden="true" /> Materials
          </h3>
          {c.materials.length ? (
            <ul className="t-list">
              {c.materials.map((m) => (
                <li key={m.id}>
                  <div>
                    <b>{m.title}</b>
                    <small>{m.kind === "file" ? m.fileName : "Link"}</small>
                  </div>
                  {m.kind === "file" ? (
                    <button type="button" className="pd-text-btn" onClick={() => downloadMaterial(m).catch((e) => setError(e.message))}>
                      Download
                    </button>
                  ) : (
                    <a className="pd-text-btn" href={m.url} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pd-empty">Nothing shared yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}

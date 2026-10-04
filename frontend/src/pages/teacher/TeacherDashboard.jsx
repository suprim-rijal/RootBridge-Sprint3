import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Video } from "lucide-react";
import { createGroup, listGroups } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { LANGUAGES } from "../../data/languages.js";

// /teacher — the teacher's home: every class, and a form to create one.
// (Sprint 3 Step 6: replaces the Sprint 2 placeholder workspace.)
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", meets: "", language: "nepali", liveClassUrl: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  // Load the classes when the page opens (state is set only after the
  // server answers).
  useEffect(() => {
    let alive = true;
    listGroups()
      .then((res) => alive && setGroups(res.data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createGroup(form);
      setGroups((list) => [res.data, ...(list ?? [])]);
      setCreated(res.data);
      setForm({ name: "", meets: "", language: form.language, liveClassUrl: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const active = LANGUAGES.filter((l) => l.status === "active");

  return (
    <div className="acct workspace teacher">
      <header className="acct-head">
        <p className="pd-eyebrow">Teacher workspace</p>
        <h1>Hello, {user.name.split(" ")[0]}</h1>
        <p className="acct-sub">Create a class, share its 6-digit code, and follow each student's progress.</p>
      </header>

      <section className="pd-panel" aria-labelledby="t-classes">
        <h2 id="t-classes">
          <Users size={18} aria-hidden="true" /> My classes
        </h2>
        {groups === null && !error ? <p className="pd-empty">Loading your classes…</p> : null}
        {groups?.length === 0 ? <p className="pd-empty">No classes yet. Create your first one below.</p> : null}
        {groups?.length ? (
          <ul className="t-class-list">
            {groups.map((g) => (
              <li key={g.id}>
                <Link to={`/teacher/classes/${g.id}`} className="t-class-card">
                  <b>{g.name}</b>
                  <span className="t-code" aria-label={`Class code ${g.code.split("").join(" ")}`}>
                    {g.code}
                  </span>
                  <small>
                    {g.memberCount} student{g.memberCount === 1 ? "" : "s"} ·{" "}
                    {LANGUAGES.find((l) => l.id === g.language)?.name ?? g.language}
                    {g.meets ? ` · ${g.meets}` : ""}
                  </small>
                  {g.liveClassUrl ? (
                    <small className="t-live">
                      <Video size={13} aria-hidden="true" /> Live link set
                    </small>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="pd-panel" aria-labelledby="t-new">
        <h2 id="t-new">
          <Plus size={18} aria-hidden="true" /> Create a class
        </h2>
        <form className="pd-form" onSubmit={submit}>
          <label className="pd-field">
            <span>Class name</span>
            <input value={form.name} onChange={set("name")} placeholder="Saturday Nepali, beginners" required maxLength={80} />
          </label>
          <label className="pd-field">
            <span>Language</span>
            <select value={form.language} onChange={set("language")}>
              {active.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="pd-field">
            <span>When it meets (optional)</span>
            <input value={form.meets} onChange={set("meets")} placeholder="Saturdays, 10:00" maxLength={80} />
          </label>
          <label className="pd-field">
            <span>Live class link (optional)</span>
            <input value={form.liveClassUrl} onChange={set("liveClassUrl")} placeholder="https://zoom.us/j/…" type="url" />
          </label>
          <div className="pd-form-actions">
            <button type="submit" className="btn btn-dark btn-sm" disabled={saving || !form.name.trim()}>
              {saving ? "Creating…" : "Create class"}
            </button>
          </div>
        </form>
        {created ? (
          <p className="pd-save-msg success" role="status">
            “{created.name}” is ready. Share the code <b className="t-code">{created.code}</b> with your students.
          </p>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

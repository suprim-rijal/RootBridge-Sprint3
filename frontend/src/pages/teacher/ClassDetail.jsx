import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Copy, FileText, Link2, Trash2, Upload, UserPlus, Users, Video } from "lucide-react";
import * as api from "../../services/api.js";
import { curriculumFor } from "../../data/curriculum.js";
import { LANGUAGES } from "../../data/languages.js";

// /teacher/classes/:id — one class.
// Five parts: the join code, class settings (incl. the live link), the
// students and their progress, homework, and shared materials.
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
const formatSize = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((n) => n + 1);

  useEffect(() => {
    let alive = true;
    api
      .getGroup(id)
      .then((res) => alive && setGroup(res.data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [id, reloadKey]);

  // Every action: run it, show a short message, reload the class.
  const run = async (action, message) => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      reload();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  if (error && !group) {
    return (
      <div className="acct workspace teacher">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/teacher" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back to my classes
        </Link>
      </div>
    );
  }
  if (!group) return <div className="acct workspace teacher"><p className="pd-empty">Loading the class…</p></div>;

  const language = LANGUAGES.find((l) => l.id === group.language);
  return (
    <div className="acct workspace teacher">
      <Link to="/teacher" className="t-back">
        <ArrowLeft size={16} aria-hidden="true" /> My classes
      </Link>
      <header className="acct-head t-head">
        <div>
          <p className="pd-eyebrow">{language?.name ?? group.language} class{group.meets ? ` · ${group.meets}` : ""}</p>
          <h1>{group.name}</h1>
        </div>
        <div className="t-code-box">
          <small>Class code</small>
          <span className="t-code big">{group.code}</span>
          <button
            type="button"
            className="pd-text-btn"
            onClick={() => navigator.clipboard?.writeText(group.code).then(() => setNotice("Code copied."))}
          >
            <Copy size={14} aria-hidden="true" /> Copy
          </button>
        </div>
      </header>

      {notice ? (
        <p className="pd-save-msg success" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <Settings group={group} run={run} />
      <Requests group={group} run={run} />
      <Students group={group} run={run} />
      <Homework group={group} run={run} />
      <Materials group={group} run={run} />

      <section className="pd-panel pd-danger">
        <h2>Delete this class</h2>
        <p className="pd-footnote">Students are removed from it, and its homework and files are deleted. This cannot be undone.</p>
        <button
          type="button"
          className="pd-btn-danger"
          onClick={async () => {
            if (!window.confirm(`Delete “${group.name}” for everyone?`)) return;
            if (await run(() => api.deleteGroup(group.id), "Class deleted.")) navigate("/teacher", { replace: true });
          }}
        >
          <Trash2 size={15} aria-hidden="true" /> Delete class
        </button>
      </section>
    </div>
  );
}

function Settings({ group, run }) {
  const [form, setForm] = useState({
    name: group.name,
    meets: group.meets,
    liveClassUrl: group.liveClassUrl,
    discoverable: group.discoverable,
    about: group.about,
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <section className="pd-panel" aria-labelledby="t-settings">
      <h2 id="t-settings">
        <Video size={18} aria-hidden="true" /> Class and live lessons
      </h2>
      <form
        className="pd-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => api.updateGroup(group.id, form), "Class saved.");
        }}
      >
        <label className="pd-field">
          <span>Class name</span>
          <input value={form.name} onChange={set("name")} required maxLength={80} />
        </label>
        <label className="pd-field">
          <span>When it meets</span>
          <input value={form.meets} onChange={set("meets")} placeholder="Saturdays, 10:00" maxLength={80} />
        </label>
        <label className="pd-field t-wide t-check">
          <input
            type="checkbox"
            checked={form.discoverable}
            onChange={(e) => setForm((f) => ({ ...f, discoverable: e.target.checked }))}
          />
          <span>
            List this class so learners can find it and ask to join (they never see the code until you approve)
          </span>
        </label>
        {form.discoverable ? (
          <label className="pd-field t-wide">
            <span>A short description for the directory</span>
            <textarea
              value={form.about}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
              rows={2}
              maxLength={300}
              placeholder="Beginner Nepali for children, Saturdays in Espoo."
            />
          </label>
        ) : null}
        <label className="pd-field t-wide">
          <span>Live class link (Zoom, Teams or Meet)</span>
          <input value={form.liveClassUrl} onChange={set("liveClassUrl")} placeholder="https://zoom.us/j/…" type="url" />
        </label>
        <div className="pd-form-actions">
          <button type="submit" className="btn btn-dark btn-sm">
            Save
          </button>
          {group.liveClassUrl ? <small className="pd-footnote">Students see a “Join live class” button.</small> : null}
        </div>
      </form>
    </section>
  );
}

// Learners who found this class in the directory and asked to join.
function Requests({ group, run }) {
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .listRequests(group.id)
      .then((res) => {
        if (!alive) return;
        setRequests(res.data);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [group.id, group.memberCount]);

  const answer = async (request, approve) => {
    const note = approve ? "" : window.prompt(`Reply to ${request.name} (optional):`, "") ?? "";
    const ok = await run(
      () => (approve ? api.approveRequest(group.id, request.id) : api.declineRequest(group.id, request.id, note)),
      approve ? `${request.name} joined the class.` : `${request.name}'s request was declined.`,
    );
    if (ok) setRequests((list) => list.filter((r) => r.id !== request.id));
  };

  if (!loaded || (!requests.length && !group.discoverable)) return null;
  return (
    <section className="pd-panel" aria-labelledby="t-requests">
      <h2 id="t-requests">
        <UserPlus size={18} aria-hidden="true" /> Requests to join
        {requests.length ? <span className="t-badge">{requests.length}</span> : null}
      </h2>
      {requests.length === 0 ? (
        <p className="pd-empty">No requests right now. Learners can find this class in “Find a class”.</p>
      ) : (
        <ul className="t-list">
          {requests.map((r) => (
            <li key={r.id}>
              <div>
                <b>{r.name}</b>
                <small>
                  {r.account !== r.name ? `family account: ${r.account} · ` : ""}
                  learning {r.language ?? "—"} · asked {formatDate(r.sentAt)}
                </small>
                {r.message ? <p>“{r.message}”</p> : null}
              </div>
              <span className="t-row-actions">
                <button type="button" className="btn btn-green btn-sm" onClick={() => answer(r, true)}>
                  Approve
                </button>
                <button type="button" className="pd-text-btn" onClick={() => answer(r, false)}>
                  Decline
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Students({ group, run }) {
  return (
    <section className="pd-panel" aria-labelledby="t-students">
      <h2 id="t-students">
        <Users size={18} aria-hidden="true" /> Students ({group.students.length})
      </h2>
      {group.students.length === 0 ? (
        <p className="pd-empty">
          No students yet. Share the code <b className="t-code">{group.code}</b>: students enter it under “My classes”.
        </p>
      ) : (
        <div className="pd-table-wrap">
          <table className="pd-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Lessons done</th>
                <th scope="col">Modules mastered</th>
                <th scope="col">XP</th>
                <th scope="col">Last active</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {group.students.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    {s.name}
                    {s.account !== s.name ? <small className="t-account">family account: {s.account}</small> : null}
                  </th>
                  <td>{s.lessonsDone}</td>
                  <td>{s.modulesMastered}</td>
                  <td>{s.xp}</td>
                  <td>{formatDate(s.lastActive)}</td>
                  <td>
                    <button
                      type="button"
                      className="pd-text-btn"
                      onClick={() => {
                        if (window.confirm(`Remove ${s.name} from ${group.name}?`)) {
                          run(() => api.removeStudent(group.id, s.id), `${s.name} was removed.`);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Homework({ group, run }) {
  const modules = curriculumFor(group.language).tracks.flatMap((t) =>
    t.chapters.flatMap((c) => c.modules.map((m) => ({ ...m, trackTitle: t.title }))),
  );
  const empty = { title: "", instructions: "", dueDate: "", moduleId: "" };
  const [form, setForm] = useState(empty);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const moduleTitle = (lessonIds) => {
    const m = modules.find((x) => x.lessons.some((l) => lessonIds.includes(l.id)));
    return m ? `${m.code} ${m.title}` : "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const mod = modules.find((m) => m.id === form.moduleId);
    const ok = await run(
      () =>
        api.addAssignment(group.id, {
          title: form.title,
          instructions: form.instructions,
          dueDate: form.dueDate || null,
          lessonIds: mod ? mod.lessons.map((l) => l.id) : [],
        }),
      "Homework posted.",
    );
    if (ok) setForm(empty);
  };

  return (
    <section className="pd-panel" aria-labelledby="t-homework">
      <h2 id="t-homework">
        <BookOpen size={18} aria-hidden="true" /> Homework
      </h2>
      {group.assignments.length ? (
        <ul className="t-list">
          {group.assignments.map((a) => (
            <li key={a.id}>
              <div>
                <b>{a.title}</b>
                <small>
                  Due {formatDate(a.dueDate)}
                  {a.lessonIds.length ? ` · ${moduleTitle(a.lessonIds)}` : ""}
                </small>
                {a.instructions ? <p>{a.instructions}</p> : null}
              </div>
              <button type="button" className="pd-text-btn" onClick={() => run(() => api.deleteAssignment(group.id, a.id), "Homework removed.")}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pd-empty">No homework yet.</p>
      )}
      <form className="pd-form" onSubmit={submit}>
        <label className="pd-field">
          <span>Title</span>
          <input value={form.title} onChange={set("title")} required maxLength={120} placeholder="Practise greetings" />
        </label>
        <label className="pd-field">
          <span>Due date (optional)</span>
          <input type="date" value={form.dueDate} onChange={set("dueDate")} />
        </label>
        <label className="pd-field t-wide">
          <span>Link a module (optional: marked done when its lessons are finished)</span>
          <select value={form.moduleId} onChange={set("moduleId")}>
            <option value="">No module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.trackTitle} · {m.code} {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="pd-field t-wide">
          <span>Instructions (optional)</span>
          <textarea value={form.instructions} onChange={set("instructions")} rows={3} maxLength={2000} />
        </label>
        <div className="pd-form-actions">
          <button type="submit" className="btn btn-dark btn-sm" disabled={!form.title.trim()}>
            Post homework
          </button>
        </div>
      </form>
    </section>
  );
}

function Materials({ group, run }) {
  const [kind, setKind] = useState("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await run(
      () => (kind === "file" ? api.addFile(group.id, { title, file }) : api.addLink(group.id, { title, url })),
      "Material shared.",
    );
    if (ok) {
      setTitle("");
      setUrl("");
      setFile(null);
      setInputKey((n) => n + 1); // clears the file input
    }
  };

  return (
    <section className="pd-panel" aria-labelledby="t-materials">
      <h2 id="t-materials">
        <FileText size={18} aria-hidden="true" /> Materials
      </h2>
      {group.materials.length ? (
        <ul className="t-list">
          {group.materials.map((m) => (
            <li key={m.id}>
              <div>
                <b>{m.title}</b>
                <small>{m.kind === "file" ? `${m.fileName} · ${formatSize(m.size)}` : m.url}</small>
              </div>
              <span className="t-row-actions">
                {m.kind === "file" ? (
                  <button type="button" className="pd-text-btn" onClick={() => run(() => api.downloadMaterial(m), "Download started.")}>
                    Download
                  </button>
                ) : (
                  <a className="pd-text-btn" href={m.url} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                )}
                <button type="button" className="pd-text-btn" onClick={() => run(() => api.deleteMaterial(group.id, m.id), "Material removed.")}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pd-empty">Nothing shared yet.</p>
      )}
      <form className="pd-form" onSubmit={submit}>
        <fieldset className="t-kind">
          <legend className="sr-only">What to share</legend>
          <label>
            <input type="radio" name="kind" checked={kind === "file"} onChange={() => setKind("file")} />
            <Upload size={14} aria-hidden="true" /> A file
          </label>
          <label>
            <input type="radio" name="kind" checked={kind === "link"} onChange={() => setKind("link")} />
            <Link2 size={14} aria-hidden="true" /> A link
          </label>
        </fieldset>
        <label className="pd-field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Greetings worksheet" />
        </label>
        {kind === "file" ? (
          <label className="pd-field">
            <span>File (PDF, Word, PowerPoint, image, audio or text; up to 10 MB)</span>
            <input key={inputKey} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        ) : (
          <label className="pd-field">
            <span>Link</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" type="url" />
          </label>
        )}
        <div className="pd-form-actions">
          <button type="submit" className="btn btn-dark btn-sm" disabled={kind === "file" ? !file : !url.trim()}>
            Share
          </button>
        </div>
      </form>
    </section>
  );
}

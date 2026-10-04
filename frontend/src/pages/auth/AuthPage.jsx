import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import GlobeScene from "../../components/GlobeScene.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_OPTIONS, ROLES } from "../../config/roles.js";

// /login and /signup share this page. mode = "login" | "signup".
// Both have a role menu: Child/Parent, Normal, Teacher.
// Sprint 3: real accounts on the server (services/api.js). Passwords are
// checked, so the demo buttons fill in the demo password too.
// After success we do NOT navigate here: the <PublicOnly> route guard
// sees the new user and sends them on (signup -> /welcome).

const DEMO_ACCOUNTS = [
  { email: "family@demo.com", role: ROLES.CHILD_PARENT, label: "Child/Parent" },
  { email: "learner@demo.com", role: ROLES.NORMAL, label: "Normal" },
  { email: "teacher@demo.com", role: ROLES.TEACHER, label: "Teacher" },
];

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, signup } = useAuth();
  const location = useLocation();

  const [role, setRole] = useState(ROLES.CHILD_PARENT);
  const [name, setName] = useState("");
  const [childName, setChildName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFamily = role === ROLES.CHILD_PARENT;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) await login(email, password, role);
      else await signup({ name, childName: isFamily ? childName : undefined, email, password, role });
      // the route guard redirects from here
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword("demo123");
    setRole(demo.role);
    setError("");
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="auth-side-copy">
          <p className="auth-kicker">Heritage languages, learned at home</p>
          <h2>Every family has a language worth keeping.</h2>
          <p>Short lessons, stories and traditions for children growing up far from their family's country of origin.</p>
        </div>
        <GlobeScene className="auth-globe" />
      </aside>

      <section className="auth-main">
        <div className="auth-tabs" role="tablist">
          <Link to="/login" state={location.state} className={isLogin ? "active" : ""} role="tab" aria-selected={isLogin}>
            Log in
          </Link>
          <Link to="/signup" className={!isLogin ? "active" : ""} role="tab" aria-selected={!isLogin}>
            Create account
          </Link>
        </div>

        <h1 className="auth-title">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-sub">{isLogin ? "Log in to continue." : "It takes less than a minute."}</p>

        {location.state?.from && isLogin ? <p className="form-note">Log in to open that page.</p> : null}

        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>I am a…</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="role-select">
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {!isLogin && (
            <div className={isFamily ? "field-row" : undefined}>
              <label className="field">
                <span>{isFamily ? "Parent's name" : "Your name"}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Sita Sharma"
                  required
                />
              </label>
              {isFamily && (
                <label className="field">
                  <span>Child's first name</span>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    autoComplete="off"
                    placeholder="Aarav"
                    required
                  />
                </label>
              )}
            </div>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </label>

          <label className="field">
            <span className="field-label-row">
              Password
              {isLogin && (
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              )}
            </span>
            <span className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "Your password" : "At least 6 characters"}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-dark btn-block" disabled={loading}>
            {loading ? (isLogin ? "Logging in…" : "Creating account…") : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        {isLogin ? (
          <div className="demo-box">
            <p>
              <b>Sprint 2 demo accounts.</b> Passwords are not checked yet.
            </p>
            <div className="demo-grid">
              {DEMO_ACCOUNTS.map((d) => (
                <button key={d.email} type="button" className="demo-account" onClick={() => fillDemo(d)}>
                  <b>{d.label}</b>
                  <span>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

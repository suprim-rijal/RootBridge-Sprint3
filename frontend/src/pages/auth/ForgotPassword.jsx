import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { requestPasswordReset } from "../../services/api.js";

// /forgot-password
// Mock: nothing is emailed in Sprint 2.
// Sprint 3: POST /api/auth/forgot-password sends a one-time reset link.
// The message is the same whether or not the email has an account, so
// this page cannot be used to check who is registered.

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" }); // idle | loading | sent | error

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "" });
    try {
      const res = await requestPasswordReset({ email });
      setStatus({ type: "sent", message: res.message });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div className="simple-card-page">
      <section className="simple-card">
        {status.type === "sent" ? (
          <>
            <span className="simple-icon" aria-hidden="true">
              <MailCheck size={26} />
            </span>
            <h1>Check your email</h1>
            <p className="simple-sub" role="status">
              {status.message} The link works for 30 minutes.
            </p>
            <p className="simple-note">Sprint 2 demo: no email is sent yet.</p>
            <Link to="/login" className="btn btn-dark btn-block">
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <h1>Forgot your password?</h1>
            <p className="simple-sub">Enter the email you signed up with. We will send you a link to choose a new password.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus({ type: "idle", message: "" });
                  }}
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </label>
              {status.type === "error" ? (
                <p className="form-error" role="alert">
                  {status.message}
                </p>
              ) : null}
              <button type="submit" className="btn btn-dark btn-block" disabled={status.type === "loading"}>
                {status.type === "loading" ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="simple-foot">
              Remembered it? <Link to="/login">Back to log in</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

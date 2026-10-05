import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="ln-page ln-center" style={{ paddingTop: 60 }}>
      <p className="auth-side-np" lang="ne" style={{ color: "var(--terracotta)" }}>
        ओहो!
      </p>
      <h1 className="ln-title">This page does not exist</h1>
      <p className="ln-sub">The link may be old or mistyped.</p>
      <p style={{ marginTop: 24 }}>
        <Link to="/" className="btn btn-primary">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}

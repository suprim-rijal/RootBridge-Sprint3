import { useState } from "react";
import { LANGUAGES } from "../data/languages.js";
import { Link } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsMsg, setNewsMsg] = useState("");

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsMsg("Enter a valid email address.");
      return;
    }
    setNewsMsg("Thanks! You are on the list.");
    setEmail("");
  };

  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo black-theme">
            <svg className="mark" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 4c-7 0-11 5-11 11 0 5 3 8 7 9.5-1 3-4 4.5-7 4.2v3.3c6 .6 11-2.3 12.5-7.5 3.7-1 6.5-4.4 6.5-9C28 9 24.5 4 20 4z"
                fill="#E2A130"
              />
            </svg>
            <span style={{ color: "#fff" }}>RootBridge</span>
          </Link>
          <p>
            Connecting kids to their heritage languages, culture, and stories.
            Cultivating confidence and connection across borders.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/dashboard">My dashboard</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact Support</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Learning Paths</h4>
          <ul>
            {/* Read from data/languages.js, so it is always up to date */}
            {LANGUAGES.filter((l) => l.status === "active").map((l) => (
              <li key={l.id}>
                {l.flag} {l.name} ({l.region})
              </li>
            ))}
            <li>More languages coming soon</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Stay Updated</h4>
          <p
            style={{ fontSize: "13.5px", color: "#b7ace0", margin: "0 0 12px" }}
          >
            Receive cultural activities and platform updates.
          </p>
          {/* Mock newsletter signup: nothing is sent in Sprint 2. */}
          <form className="footer-news" onSubmit={handleSubscribe} noValidate>
            <label htmlFor="footer-email" className="sr-only">
              Email for updates
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setNewsMsg("");
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Join
            </button>
          </form>
          <p className="footer-news-msg" aria-live="polite">
            {newsMsg}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© {CURRENT_YEAR} RootBridge. All rights reserved.</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
        </div>
      </div>
    </footer>
  );
}

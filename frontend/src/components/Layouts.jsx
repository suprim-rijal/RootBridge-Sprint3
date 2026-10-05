import { Link, Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// MainLayout: normal pages (Navbar + page + Footer).
export function MainLayout() {
  return (
    <>
      <Navbar />
      <div className="navbar-spacer"></div>
      <main className="main-content" id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

// FocusLayout: onboarding + welcome. Only the logo and a log-out link,
// so new users are not pulled away before they finish.
export function FocusLayout() {
  const { logout } = useAuth();
  return (
    <div className="focus-layout">
      <header className="focus-header">
        <Link to="/" className="logo">
          <svg className="mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path
              d="M20 4c-7 0-11 5-11 11 0 5 3 8 7 9.5-1 3-4 4.5-7 4.2v3.3c6 .6 11-2.3 12.5-7.5 3.7-1 6.5-4.4 6.5-9C28 9 24.5 4 20 4z"
              fill="#E2A130"
            />
            <circle cx="24" cy="12" r="2.4" fill="#241A12" />
          </svg>
          <span>RootBridge</span>
        </Link>
        <button type="button" className="link-btn" onClick={logout}>
          Log out
        </button>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}

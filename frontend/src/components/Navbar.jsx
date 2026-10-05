import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../config/roles.js";
import ViewSwitch from "./ViewSwitch.jsx";
import LivesBar from "./LivesBar.jsx";
import { timeUntil, useLives } from "../lib/lives.js";

// Main site navigation.
// - Logged out: Home, About, Contact + Log in / Create account
// - Logged in:  links depend on the role (and, for Child/Parent, the view)
//     Child/Parent child view : Dashboard, Language, Culture, Passport
//     Child/Parent parent view: Parent overview, Profile
//     Normal                  : Dashboard, Language, Culture, Profile
//     Teacher                 : My classes, Profile
// - Phones: links move into a menu opened with the ☰ button.
const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

// Links for a logged-in user. The last link is always the profile page.
function linksFor(role, isParentView, allowedTracks) {
  const learnLinks = [
    allowedTracks.language && { to: "/learn/language", label: "Language" },
    allowedTracks.culture && { to: "/learn/culture", label: "Culture" },
  ].filter(Boolean);
  if (role === ROLES.CHILD_PARENT && isParentView) {
    return [
      { to: "/parent", label: "Parent overview", end: true },
      { to: "/parent/profile", label: "Profile" },
    ];
  }
  const classes = { to: "/classes", label: "Classes" }; // Sprint 3: teacher classes
  if (role === ROLES.CHILD_PARENT) {
    return [{ to: "/dashboard", label: "Dashboard" }, ...learnLinks, classes, { to: "/passport", label: "Passport" }];
  }
  if (role === ROLES.NORMAL) {
    return [{ to: "/dashboard", label: "Dashboard" }, ...learnLinks, classes, { to: "/profile", label: "Profile" }];
  }
  // Teacher
  return [
    { to: "/teacher", label: "My classes", end: true },
    { to: "/teacher/profile", label: "Profile" },
  ];
}

export default function Navbar() {
  const { user, isFamily, isParentView, learnerName, learningRules, logout } = useAuth();
  // Hearts stay visible on every page: dashboard, paths, module pages.
  // (Only Normal learners have hearts; for everyone else this is off.)
  const hearts = useLives();
  const [scroll, setScroll] = useState({ visible: true, scrolled: false, lastY: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide the bar when scrolling down, show it when scrolling up.
  useEffect(() => {
    const onScroll = () => {
      setScroll((prev) => {
        const y = window.scrollY;
        return { scrolled: y > 20, visible: y < prev.lastY || y < 100, lastY: y };
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = !user ? PUBLIC_LINKS : linksFor(user.role, isParentView, learningRules.allowedTracks);
  // The last link of each role's list is its profile page.
  const profilePath = links.at(-1).to;

  // Child view shows the child's name and photo; everything else the account's.
  const childView = isFamily && !isParentView;
  const shownName = childView ? learnerName : user?.name;
  const shownAvatar = isFamily && !childView ? user?.details.parentAvatar : user?.details.avatar;

  return (
    <nav
      className={`main-nav ${scroll.scrolled ? "scrolled" : ""} ${!scroll.visible && !menuOpen ? "nav-hidden" : ""} ${menuOpen ? "menu-open" : ""}`}
      aria-label="Main"
    >
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

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Clicking any link inside the phone menu closes it. */}
      <div
        className="nav-menu"
        id="main-menu"
        onClick={(event) => {
          if (event.target.closest("a, button") && !event.target.closest(".pin-dialog")) setMenuOpen(false);
        }}
      >
        <ul className="nav-links">
          {links.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {hearts.enabled ? (
            <Link
              to="/dashboard"
              className="nav-hearts"
              title={hearts.nextHeartAt ? `Next heart in ${timeUntil(hearts.nextHeartAt)}` : "Your hearts"}
              aria-label={`${hearts.lives} of ${hearts.max} hearts`}
            >
              <LivesBar lives={hearts} compact />
            </Link>
          ) : null}
          {user ? (
            <>
              <ViewSwitch />
              <Link to={profilePath} className="nav-user" title="Open your profile">
                <span className="nav-avatar">
                  {shownAvatar ? <img src={shownAvatar} alt="" /> : <UserRound size={16} />}
                </span>
                <span className="nav-user-name">{shownName}</span>
              </Link>
              <button onClick={logout} className="link-btn" type="button">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link-btn">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-dark btn-sm">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// When the page (URL) changes, jump back to the top of the window.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

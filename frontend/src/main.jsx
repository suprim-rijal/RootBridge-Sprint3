import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Elearn base theme (colours, fonts, buttons, navbar, footer)
import "./App.css"; // Learning-world styles built on the same Elearn variables
import "./styles/flow.css"; // Auth, onboarding, dashboards, passport
import "./styles/sprint3.css"; // Sprint 3: hearts, new exercise styles, explanations
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

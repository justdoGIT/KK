import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "./styles/mobile-chapters.css";
import "./styles/mobile-refinements.css";
import "./styles/mobile-polish.css";
import "./styles/architecture-zoom.css";
import { quietThreeClockDeprecation } from "./lib/quiet-three-warnings.ts";

quietThreeClockDeprecation();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

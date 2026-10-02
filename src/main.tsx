import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { quietThreeClockDeprecation } from "./lib/quiet-three-warnings.ts";

quietThreeClockDeprecation();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

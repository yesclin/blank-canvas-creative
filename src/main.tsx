import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/app/ErrorBoundary";

// NOTE: Analytics bootstrap is intentionally deferred to inside <App />
// (useEffect) so that no third-party module touches React internals before
// the React runtime is fully initialized. This prevents
// "Cannot read properties of null (reading 'useRef')" type crashes caused
// by side-effectful imports running before mount.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary scope="App">
      <App />
    </ErrorBoundary>
  </StrictMode>
);


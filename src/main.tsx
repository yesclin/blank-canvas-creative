import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/app/ErrorBoundary";
import { bootstrapAnalytics } from "./lib/analytics";

// Loads PostHog only if the user previously granted consent.
bootstrapAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary scope="App">
      <App />
    </ErrorBoundary>
  </StrictMode>
);


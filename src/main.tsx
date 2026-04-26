import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/app/ErrorBoundary";

declare global {
  interface Window {
    __ycLastEvent?: string;
  }
}

if (typeof window !== "undefined") {
  ["click", "keydown", "submit", "popstate"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      (event) => {
        const target = event.target as HTMLElement | null;
        window.__ycLastEvent = `${eventName}${target?.tagName ? `:${target.tagName.toLowerCase()}` : ""}`;
      },
      { capture: true, passive: true }
    );
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[YesClin boot] Root element #root was not found", {
    route: window.location.pathname,
    lastEvent: window.__ycLastEvent ?? null,
  });
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary scope="App">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

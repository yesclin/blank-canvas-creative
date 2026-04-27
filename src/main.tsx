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
  console.log("[APP_INIT] iniciado", { route: window.location.pathname });
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

  // Captura global de erros não tratados — evita tela branca silenciosa.
  // Não substitui o ErrorBoundary, apenas garante que erros assíncronos
  // (fora do React) sejam logados de forma rastreável.
  window.addEventListener("error", (event) => {
    console.error("[GLOBAL_ERROR]", {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      route: window.location.pathname,
      lastEvent: window.__ycLastEvent ?? null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[PROMISE_ERROR]", {
      reason: event.reason,
      route: window.location.pathname,
      lastEvent: window.__ycLastEvent ?? null,
    });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[APP_ERROR]", "Root element #root was not found", {
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

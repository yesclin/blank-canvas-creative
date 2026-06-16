import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/app/ErrorBoundary";
import { clearUnsafeAuthCache } from "./lib/authSessionIsolation";

// Limpa chaves antigas/inseguras de identidade no boot. NUNCA confiamos em
// localStorage/sessionStorage como fonte de verdade do usuário autenticado.
clearUnsafeAuthCache();

// O app NÃO usa Service Worker / PWA. Se algum SW residual ficou registrado
// (de um preview anterior, por exemplo), ele pode servir HTML/JS/JSON
// desatualizado e mascarar o cache do React Query. Desregistramos no boot e
// limpamos as Cache Storage associadas — é seguro e idempotente.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      void reg.unregister().then((ok) => {
        if (ok && import.meta.env.DEV) console.warn("[SW] unregister:", reg.scope);
      });
    });
  }).catch(() => { /* ignore */ });
  if ("caches" in window) {
    void caches.keys().then((keys) => {
      keys.forEach((k) => { void caches.delete(k); });
    }).catch(() => { /* ignore */ });
  }
}

declare global {
  interface Window {
    __ycLastEvent?: string;
    __ycRouteRenderedAt?: number;
  }
}

if (typeof window !== "undefined") {
  if (import.meta.env.DEV) {
    console.log("[APP_INIT] iniciado", { route: window.location.pathname });
  }
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

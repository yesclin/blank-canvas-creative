/**
 * Unit tests for the CORS configuration of the `send-invite` Edge Function.
 *
 * These tests do NOT hit the network — they exercise the in-process handler
 * and helpers directly so they remain fast and stable across environments.
 *
 * Coverage:
 *  1. `isAllowedOrigin` — exact and pattern matches, plus rejections.
 *  2. OPTIONS preflight — returns expected `Access-Control-*` headers and
 *     echoes the origin only when allowed.
 *  3. GET /diagnostics — returns the full CORS configuration payload.
 */

import {
  assertEquals,
  assertStringIncludes,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  ALLOWED_EXACT_ORIGINS,
  ALLOWED_METHODS,
  ALLOWED_REQUEST_HEADERS,
  buildDiagnosticsPayload,
  getCorsHeaders,
  handler,
  isAllowedOrigin,
} from "./index.ts";

const FN_URL = "https://example.supabase.co/functions/v1/send-invite";

function makeRequest(
  method: string,
  origin: string | null,
  pathOrQuery: "" | "/diagnostics" | "?diagnostics=1" = "",
): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request(`${FN_URL}${pathOrQuery}`, { method, headers });
}

// ───────────────────────────────────────────────────────────────────────────
// 1. isAllowedOrigin
// ───────────────────────────────────────────────────────────────────────────

Deno.test("isAllowedOrigin accepts canonical production origins", () => {
  for (const origin of ALLOWED_EXACT_ORIGINS) {
    assert(isAllowedOrigin(origin), `expected ${origin} to be allowed`);
  }
});

Deno.test("isAllowedOrigin accepts Lovable preview/sandbox/published hosts", () => {
  const allowed = [
    "https://39fb8097-f8db-4313-8a8d-9b89d32fcf33.lovable.app",
    "https://id-preview--39fb8097-f8db-4313-8a8d-9b89d32fcf33.lovable.app",
    "https://blank-canvas-creator-9282.lovable.app",
    "https://my-project.lovableproject.com",
    "https://test-app.lovable.dev",
    "https://app.yesclin.com",
  ];
  for (const origin of allowed) {
    assert(isAllowedOrigin(origin), `expected ${origin} to be allowed`);
  }
});

Deno.test("isAllowedOrigin rejects unknown / spoofed origins", () => {
  const rejected = [
    "",
    "https://evil.com",
    "https://yesclin.com.evil.com",
    "https://lovable.app.evil.com",
    "http://yesclin.com", // wrong scheme
    "https://yesclin", // missing TLD
  ];
  for (const origin of rejected) {
    assertEquals(
      isAllowedOrigin(origin),
      false,
      `expected ${origin} to be rejected`,
    );
  }
});

Deno.test("getCorsHeaders echoes allowed origin and falls back to canonical otherwise", () => {
  const allowedReq = makeRequest("OPTIONS", "https://yesclin.com");
  const allowedHeaders = getCorsHeaders(allowedReq);
  assertEquals(allowedHeaders["Access-Control-Allow-Origin"], "https://yesclin.com");
  assertEquals(allowedHeaders["Access-Control-Allow-Methods"], ALLOWED_METHODS);
  assertEquals(allowedHeaders["Access-Control-Allow-Headers"], ALLOWED_REQUEST_HEADERS);
  assertEquals(allowedHeaders["Vary"], "Origin");

  const rejectedReq = makeRequest("OPTIONS", "https://evil.com");
  const rejectedHeaders = getCorsHeaders(rejectedReq);
  assertEquals(
    rejectedHeaders["Access-Control-Allow-Origin"],
    ALLOWED_EXACT_ORIGINS[0],
    "should fall back to canonical origin when caller is not allowed",
  );
});

// ───────────────────────────────────────────────────────────────────────────
// 2. OPTIONS preflight via the real handler
// ───────────────────────────────────────────────────────────────────────────

Deno.test("OPTIONS preflight from allowed origin returns full CORS headers", async () => {
  const res = await handler(
    makeRequest("OPTIONS", "https://id-preview--39fb8097-f8db-4313-8a8d-9b89d32fcf33.lovable.app"),
  );
  // Always consume body to avoid resource leaks in Deno tests.
  await res.text();

  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("access-control-allow-origin"),
    "https://id-preview--39fb8097-f8db-4313-8a8d-9b89d32fcf33.lovable.app",
  );
  assertStringIncludes(
    res.headers.get("access-control-allow-headers") ?? "",
    "authorization",
  );
  assertStringIncludes(
    res.headers.get("access-control-allow-methods") ?? "",
    "POST",
  );
  assertEquals(res.headers.get("vary"), "Origin");
});

Deno.test("OPTIONS preflight from disallowed origin falls back to canonical origin", async () => {
  const res = await handler(makeRequest("OPTIONS", "https://evil.com"));
  await res.text();

  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("access-control-allow-origin"),
    ALLOWED_EXACT_ORIGINS[0],
  );
});

// ───────────────────────────────────────────────────────────────────────────
// 3. GET /diagnostics endpoint
// ───────────────────────────────────────────────────────────────────────────

Deno.test("GET /diagnostics returns the full CORS configuration", async () => {
  const origin = "https://yesclin.com";
  const res = await handler(makeRequest("GET", origin, "/diagnostics"));
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(body.function, "send-invite");
  assertEquals(body.request.method, "GET");
  assertEquals(body.request.origin, origin);
  assertEquals(body.request.accepted, true);
  assertEquals(body.cors.allowed_methods, ALLOWED_METHODS);
  assertEquals(body.cors.allowed_headers, ALLOWED_REQUEST_HEADERS);
  assert(
    Array.isArray(body.cors.allowed_exact_origins) &&
      body.cors.allowed_exact_origins.includes("https://yesclin.com"),
  );
  assert(
    Array.isArray(body.cors.allowed_origin_patterns) &&
      body.cors.allowed_origin_patterns.length > 0,
  );
});

Deno.test("GET ?diagnostics=1 also serves the diagnostics payload", async () => {
  const res = await handler(
    makeRequest("GET", "https://www.yesclin.com", "?diagnostics=1"),
  );
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.function, "send-invite");
  assertEquals(body.request.accepted, true);
});

Deno.test("GET /diagnostics from disallowed origin reports accepted=false", async () => {
  const res = await handler(makeRequest("GET", "https://evil.com", "/diagnostics"));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.request.accepted, false);
  assertEquals(
    res.headers.get("access-control-allow-origin"),
    ALLOWED_EXACT_ORIGINS[0],
  );
});

// ───────────────────────────────────────────────────────────────────────────
// 4. buildDiagnosticsPayload — pure function sanity check
// ───────────────────────────────────────────────────────────────────────────

Deno.test("buildDiagnosticsPayload serializes regex patterns as strings", () => {
  const payload = buildDiagnosticsPayload(makeRequest("GET", "https://yesclin.com"));
  for (const pattern of payload.cors.allowed_origin_patterns) {
    assertEquals(typeof pattern, "string");
  }
  assertEquals(typeof payload.timestamp, "string");
});

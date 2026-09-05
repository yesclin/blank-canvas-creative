/**
 * Tests for the central CORS helper shared by all Edge Functions.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ALLOWED_EXACT_ORIGINS,
  getCorsHeaders,
  isAllowedOrigin,
  NO_CORS_HEADERS,
} from "./cors.ts";

function req(origin: string | null, method = "OPTIONS"): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("https://example.supabase.co/functions/v1/x", { method, headers });
}

Deno.test("allows official production origins", () => {
  for (const o of ["https://yesclin.com.br", "https://www.yesclin.com.br", "https://yesclin.com"]) {
    assert(isAllowedOrigin(o), o);
  }
});

Deno.test("allows localhost development origins", () => {
  for (const o of ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"]) {
    assert(isAllowedOrigin(o), o);
  }
});

Deno.test("allows controlled Lovable preview hosts", () => {
  assert(isAllowedOrigin("https://id-preview--39fb8097-f8db-4313-8a8d-9b89d32fcf33.lovable.app"));
  assert(isAllowedOrigin("https://yesclin.lovable.app"));
});

Deno.test("rejects unknown and spoofed origins", () => {
  for (const o of [
    "https://evil.com",
    "https://yesclin.com.br.evil.com",
    "https://lovable.app.evil.com",
    "http://localhost:8080.evil.com",
    "",
  ]) {
    assertEquals(isAllowedOrigin(o), false, o);
  }
});

Deno.test("never returns a wildcard origin", () => {
  const headers = getCorsHeaders(req("https://evil.com"));
  assertEquals(headers["Access-Control-Allow-Origin"], ALLOWED_EXACT_ORIGINS[0]);
  assertEquals(headers["Vary"], "Origin");
  assertEquals(headers["Access-Control-Allow-Origin"] === "*", false);
});

Deno.test("echoes the caller origin when allowed and honours custom methods", () => {
  const headers = getCorsHeaders(req("http://localhost:8080"), { methods: "GET, POST, OPTIONS" });
  assertEquals(headers["Access-Control-Allow-Origin"], "http://localhost:8080");
  assertEquals(headers["Access-Control-Allow-Methods"], "GET, POST, OPTIONS");
});

Deno.test("extra headers are appended to the standard allow-list", () => {
  const headers = getCorsHeaders(req("https://yesclin.com.br"), { extraHeaders: ["x-worker-secret"] });
  assert(headers["Access-Control-Allow-Headers"].includes("x-worker-secret"));
  assert(headers["Access-Control-Allow-Headers"].includes("authorization"));
});

Deno.test("server-to-server headers grant no browser access", () => {
  assertEquals(NO_CORS_HEADERS["Access-Control-Allow-Origin"], undefined);
  assertEquals(NO_CORS_HEADERS["Vary"], "Origin");
});

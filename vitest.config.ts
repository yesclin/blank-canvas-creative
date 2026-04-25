import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      // Only measure source files we care about; exclude tests, mocks,
      // generated types, and infra glue.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/**/__tests__/**",
        "src/**/__mocks__/**",
        "src/integrations/supabase/types.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      // Per-file thresholds for the signature validation module: it is a
      // small pure-logic file gating a security-sensitive flow (LGPD consent
      // signing), so we require near-total coverage. CI fails if coverage on
      // this file drops below the thresholds.
      thresholds: {
        "src/components/prontuario/aesthetics/signatureValidation.ts": {
          lines: 100,
          functions: 100,
          branches: 95,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

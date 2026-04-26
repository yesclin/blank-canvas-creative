import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: INTER } = loadInter("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// Brand palette — YesClin
export const COLORS = {
  primary: "#0EA5E9", // sky-500
  primaryDark: "#0369A1", // sky-700
  primaryDeep: "#0C4A6E", // sky-900
  accent: "#22D3EE", // cyan-400
  white: "#FFFFFF",
  ink: "#0F172A", // slate-900
  inkSoft: "#1E293B", // slate-800
  muted: "#94A3B8", // slate-400
  bgSoft: "#F1F5F9", // slate-100
};

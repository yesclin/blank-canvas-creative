import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, INTER } from "../theme";
import { Caption } from "../components/Shared";

// CENA 1 — Gancho: "Sua clínica ainda é desorganizada?"
export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shaking chaos icons to imply disorganization
  const shake = (seed: number) =>
    Math.sin(frame * 0.5 + seed) * 6 + Math.cos(frame * 0.3 + seed * 2) * 4;

  const items = [
    { emoji: "📅", x: 12, y: 18, rot: -12, size: 130 },
    { emoji: "📋", x: 78, y: 22, rot: 18, size: 140 },
    { emoji: "💸", x: 18, y: 42, rot: 8, size: 120 },
    { emoji: "📞", x: 72, y: 50, rot: -18, size: 130 },
    { emoji: "📁", x: 14, y: 68, rot: 14, size: 130 },
    { emoji: "✉️", x: 76, y: 72, rot: -10, size: 120 },
  ];

  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const enter = spring({
          frame: frame - i * 2,
          fps,
          config: { damping: 12, stiffness: 200 },
        });
        const op = interpolate(enter, [0, 1], [0, 0.85]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${it.x}%`,
              top: `${it.y}%`,
              fontSize: it.size,
              transform: `translate(${shake(i)}px, ${shake(i + 5)}px) rotate(${
                it.rot + Math.sin(frame * 0.1 + i) * 4
              }deg) scale(${enter})`,
              opacity: op,
              filter: "drop-shadow(0 8px 20px rgba(15,23,42,0.2))",
            }}
          >
            {it.emoji}
          </div>
        );
      })}

      {/* Big question mark in the center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 480,
          fontFamily: INTER,
          fontWeight: 900,
          color: "rgba(14,165,233,0.08)",
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.04})`,
        }}
      >
        ?
      </div>

      <Caption
        title={"Sua clínica\nainda é\ndesorganizada?"}
        position="top"
        accent
      />
    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, INTER } from "../theme";

// CENA 8 — CTA: "Teste grátis agora"
export const Scene8CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const titleScale = interpolate(titleSpring, [0, 1], [0.7, 1]);
  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const subSpring = spring({ frame: frame - 14, fps, config: { damping: 20, stiffness: 130 } });
  const subY = interpolate(subSpring, [0, 1], [40, 0]);
  const subOp = interpolate(frame, [14, 26], [0, 1], { extrapolateRight: "clamp" });

  const btnSpring = spring({ frame: frame - 26, fps, config: { damping: 12, stiffness: 180 } });
  const btnScale = interpolate(btnSpring, [0, 1], [0.5, 1]);
  const btnOp = interpolate(frame, [26, 38], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing CTA
  const pulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [1, 1.06]);
  const glow = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.4, 0.85]);

  // Confetti / spark dots
  const dots = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const start = spring({ frame: frame - 30 - i, fps, config: { damping: 10, stiffness: 120 } });
    const radius = interpolate(start, [0, 1], [0, 380]);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const op = interpolate(start, [0, 0.5, 1], [0, 1, 0]);
    return { x, y, op, color: i % 2 === 0 ? COLORS.primary : COLORS.accent };
  });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 60px" }}>
      {/* Confetti */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: d.color,
              transform: `translate(${d.x}px, ${d.y}px)`,
              opacity: d.op,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 900,
          fontSize: 140,
          letterSpacing: -5,
          textAlign: "center",
          lineHeight: 1,
          color: COLORS.ink,
          opacity: titleOp,
          transform: `scale(${titleScale})`,
          marginBottom: 30,
        }}
      >
        Teste{" "}
        <span
          style={{
            background: `linear-gradient(120deg, ${COLORS.primary}, ${COLORS.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          grátis
        </span>
        <br />
        agora
      </div>

      <div
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 42,
          color: COLORS.inkSoft,
          textAlign: "center",
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          marginBottom: 80,
        }}
      >
        7 dias sem cartão • Clique no link
      </div>

      {/* CTA button */}
      <div
        style={{
          opacity: btnOp,
          transform: `scale(${btnScale * pulse})`,
        }}
      >
        <div
          style={{
            padding: "36px 80px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            color: COLORS.white,
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: 56,
            letterSpacing: -1,
            boxShadow: `0 30px 80px rgba(14,165,233,${glow})`,
          }}
        >
          Começar agora →
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 60,
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: 38,
          color: COLORS.primaryDark,
          opacity: btnOp,
        }}
      >
        yesclin.app
      </div>
    </AbsoluteFill>
  );
};

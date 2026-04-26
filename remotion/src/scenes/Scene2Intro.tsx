import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, INTER } from "../theme";

// CENA 2 — Apresentação: "Conheça o YesClin"
export const Scene2Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 140 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOp = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" });

  const subSpring = spring({ frame: frame - 20, fps, config: { damping: 20, stiffness: 130 } });
  const subY = interpolate(subSpring, [0, 1], [40, 0]);
  const subOp = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing ring around logo
  const ringPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.95, 1.15]);

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {/* Logo block */}
      <div
        style={{
          position: "relative",
          marginBottom: 80,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        {/* Pulsing rings */}
        <div
          style={{
            position: "absolute",
            inset: -40,
            borderRadius: "50%",
            border: `4px solid ${COLORS.primary}`,
            opacity: 0.25,
            transform: `scale(${ringPulse})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -80,
            borderRadius: "50%",
            border: `4px solid ${COLORS.accent}`,
            opacity: 0.18,
            transform: `scale(${ringPulse * 1.05})`,
          }}
        />
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 60px rgba(14,165,233,0.45)",
          }}
        >
          {/* Stylized Y mark */}
          <svg width="160" height="160" viewBox="0 0 100 100">
            <path
              d="M20 15 L50 55 L80 15 M50 55 L50 90"
              stroke="#FFFFFF"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div
        style={{
          fontFamily: INTER,
          fontWeight: 900,
          fontSize: 140,
          color: COLORS.ink,
          letterSpacing: -5,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          lineHeight: 1,
        }}
      >
        YesClin
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 44,
          color: COLORS.inkSoft,
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        Sistema completo para clínicas
      </div>
    </AbsoluteFill>
  );
};

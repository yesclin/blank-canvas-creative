import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const features = [
  { icon: "📅", label: "Agenda Inteligente", color: "#38bdf8" },
  { icon: "📋", label: "Prontuário Digital", color: "#818cf8" },
  { icon: "💰", label: "Gestão Financeira", color: "#34d399" },
  { icon: "👥", label: "Multi-Clínica", color: "#f472b6" },
];

export const Scene2Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontFamily: "sans-serif",
          fontSize: 52,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          marginBottom: 80,
          lineHeight: 1.2,
        }}
      >
        Tudo que sua clínica
        <br />
        <span style={{ color: "#38bdf8" }}>precisa</span>
      </div>

      {/* Feature cards with 3D perspective */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%" }}>
        {features.map((feat, i) => {
          const cardSpring = spring({
            frame: frame - 10 - i * 8,
            fps,
            config: { damping: 12, stiffness: 120 },
          });
          const rotateY = interpolate(cardSpring, [0, 1], [-25, 0]);
          const floatY = Math.sin((frame + i * 20) * 0.06) * 4;

          return (
            <div
              key={i}
              style={{
                transform: `perspective(800px) rotateY(${rotateY}deg) translateX(${interpolate(cardSpring, [0, 1], [200, 0])}px) translateY(${floatY}px)`,
                opacity: cardSpring,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 24,
                padding: "28px 36px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                border: `1px solid ${feat.color}33`,
                backdropFilter: undefined,
              }}
            >
              {/* Icon container with glow */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: `${feat.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  boxShadow: `0 0 20px ${feat.color}33`,
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 30,
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {feat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

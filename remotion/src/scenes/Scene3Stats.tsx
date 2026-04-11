import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const stats = [
  { value: "500+", label: "Clínicas", color: "#38bdf8" },
  { value: "10k+", label: "Pacientes", color: "#818cf8" },
  { value: "98%", label: "Satisfação", color: "#34d399" },
];

export const Scene3Stats = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div
        style={{
          transform: `scale(${interpolate(titleScale, [0, 1], [0.8, 1])})`,
          opacity: titleScale,
          fontFamily: "sans-serif",
          fontSize: 44,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          marginBottom: 80,
        }}
      >
        Confiado por
        <br />
        <span style={{ color: "#34d399" }}>profissionais de saúde</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
        {stats.map((stat, i) => {
          const s = spring({ frame: frame - 12 - i * 10, fps, config: { damping: 10 } });
          const rotateZ = interpolate(s, [0, 1], [10, 0]);
          const scale3d = interpolate(s, [0, 1], [0.5, 1]);
          const floatY = Math.sin((frame + i * 30) * 0.07) * 6;

          // Count up effect
          const numericPart = stat.value.replace(/\D/g, "");
          const suffix = stat.value.replace(/\d/g, "");
          const target = parseInt(numericPart) || 0;
          const progress = interpolate(frame, [15 + i * 10, 45 + i * 10], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const displayNum = Math.round(target * progress);
          const displayValue = target > 100 ? `${displayNum}${suffix}` : `${displayNum}${suffix}`;

          return (
            <div
              key={i}
              style={{
                transform: `perspective(600px) rotateZ(${rotateZ}deg) scale(${scale3d}) translateY(${floatY}px)`,
                opacity: s,
                textAlign: "center",
                padding: "36px 60px",
                borderRadius: 28,
                background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`,
                border: `1px solid ${stat.color}40`,
                minWidth: 320,
              }}
            >
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 72,
                  fontWeight: 800,
                  color: stat.color,
                  lineHeight: 1,
                }}
              >
                {displayValue}
              </div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 24,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 8,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

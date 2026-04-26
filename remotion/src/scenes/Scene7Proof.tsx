import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";
import { COLORS, INTER } from "../theme";

// CENA 7 — Prova: "Mais organização. Mais lucro."
export const Scene7Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dashSpring = spring({ frame, fps, config: { damping: 18, stiffness: 130 } });
  const dashScale = interpolate(dashSpring, [0, 1], [0.85, 1]);
  const dashOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  // KPI numbers count up
  const v1 = Math.round(interpolate(frame, [10, 50], [0, 47], { extrapolateRight: "clamp" }));
  const v2 = Math.round(interpolate(frame, [15, 55], [0, 32], { extrapolateRight: "clamp" }));
  const v3 = Math.round(interpolate(frame, [20, 60], [0, 89], { extrapolateRight: "clamp" }));

  const titleSpring = spring({ frame: frame - 22, fps, config: { damping: 18, stiffness: 140 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOp = interpolate(frame, [22, 36], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 60px" }}>
      {/* Dashboard mockup */}
      <div
        style={{
          width: 920,
          padding: 36,
          borderRadius: 36,
          background: COLORS.white,
          boxShadow: "0 30px 60px rgba(14,165,233,0.25)",
          border: `1px solid rgba(14,165,233,0.15)`,
          transform: `scale(${dashScale})`,
          opacity: dashOp,
          marginBottom: 80,
        }}
      >
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 28,
            color: COLORS.muted,
            marginBottom: 24,
          }}
        >
          Resultados do mês
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          {[
            { label: "Atendimentos", value: `+${v1}%`, color: COLORS.primary },
            { label: "Faturamento", value: `+${v2}%`, color: COLORS.accent },
            { label: "Satisfação", value: `${v3}%`, color: "#10B981" },
          ].map((kpi, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: 24,
                borderRadius: 24,
                background: COLORS.bgSoft,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: INTER,
                  fontWeight: 900,
                  fontSize: 56,
                  color: kpi.color,
                  letterSpacing: -2,
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontFamily: INTER,
                  fontWeight: 600,
                  fontSize: 22,
                  color: COLORS.inkSoft,
                  marginTop: 4,
                }}
              >
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Animated bars chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200 }}>
          {[40, 55, 50, 70, 65, 85, 95].map((h, i) => {
            const grow = spring({
              frame: frame - 10 - i * 3,
              fps,
              config: { damping: 18, stiffness: 140 },
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * grow}%`,
                  borderRadius: 12,
                  background: `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          fontFamily: INTER,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.ink,
          letterSpacing: -3,
          textAlign: "center",
          lineHeight: 1.05,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Mais organização.{" "}
        <span
          style={{
            background: `linear-gradient(120deg, ${COLORS.primary}, ${COLORS.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Mais lucro.
        </span>
      </div>
    </AbsoluteFill>
  );
};

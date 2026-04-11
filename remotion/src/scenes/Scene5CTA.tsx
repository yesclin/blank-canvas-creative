import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

export const Scene5CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const btnSpring = spring({ frame: frame - 20, fps, config: { damping: 10 } });
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Pulsing button glow
  const pulseScale = 1 + Math.sin(frame * 0.15) * 0.03;
  const glowIntensity = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.3, 0.8]);

  // Rotating ring
  const ringRotate = interpolate(frame, [0, 90], [0, 360]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Rotating ring decoration */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: "1px solid rgba(56,189,248,0.1)",
          transform: `rotate(${ringRotate}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#38bdf8",
            boxShadow: "0 0 12px #38bdf8",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          border: "1px solid rgba(129,140,248,0.08)",
          transform: `rotate(${-ringRotate * 0.7}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#818cf8",
            boxShadow: "0 0 10px #818cf8",
          }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          transform: `scale(${interpolate(titleSpring, [0, 1], [0.5, 1])}) perspective(600px) rotateX(${interpolate(titleSpring, [0, 1], [20, 0])}deg)`,
          opacity: titleSpring,
          fontFamily: "sans-serif",
          fontSize: 80,
          fontWeight: 800,
          color: "white",
          letterSpacing: -2,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Yes<span style={{ color: "#38bdf8" }}>Clin</span>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          fontFamily: "sans-serif",
          fontSize: 30,
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          marginBottom: 60,
          lineHeight: 1.4,
        }}
      >
        Simplifique a gestão
        <br />
        da sua clínica
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${interpolate(btnSpring, [0, 1], [0.5, 1]) * pulseScale}) perspective(600px) rotateX(${interpolate(btnSpring, [0, 1], [15, 0])}deg)`,
          opacity: btnSpring,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            borderRadius: 60,
            padding: "24px 64px",
            boxShadow: `0 0 ${40 * glowIntensity}px rgba(56,189,248,${glowIntensity * 0.5}), 0 20px 40px rgba(0,0,0,0.3)`,
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
            }}
          >
            Comece Grátis →
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div
        style={{
          opacity: taglineOpacity,
          display: "flex",
          gap: 32,
          marginTop: 48,
        }}
      >
        {["Sem cartão", "Suporte incluso", "LGPD"].map((b, i) => (
          <div
            key={i}
            style={{
              fontFamily: "sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "#34d399" }}>✓</span>
            {b}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

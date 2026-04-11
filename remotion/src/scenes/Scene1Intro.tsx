import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3D rotating cross/plus shape
  const rotateY = interpolate(frame, [0, 80], [0, 360]);
  const rotateX = interpolate(frame, [0, 80], [0, 180]);

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleY = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const badgeScale = spring({ frame: frame - 40, fps, config: { damping: 10 } });

  // Pulsing glow
  const glowOpacity = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.7]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)",
          opacity: glowOpacity,
        }}
      />

      {/* 3D Medical Cross */}
      <div
        style={{
          transform: `scale(${logoScale}) perspective(800px) rotateY(${rotateY}deg) rotateX(${rotateX * 0.3}deg)`,
          marginBottom: 60,
        }}
      >
        <div style={{ position: "relative", width: 120, height: 120 }}>
          {/* Horizontal bar */}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              width: 120,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              boxShadow: "0 0 40px rgba(56,189,248,0.5)",
            }}
          />
          {/* Vertical bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 40,
              width: 40,
              height: 120,
              borderRadius: 12,
              background: "linear-gradient(180deg, #38bdf8, #818cf8)",
              boxShadow: "0 0 40px rgba(129,140,248,0.5)",
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${interpolate(titleY, [0, 1], [60, 0])}px)`,
          opacity: titleY,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 96,
            fontWeight: 800,
            color: "white",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          Yes
          <span style={{ color: "#38bdf8" }}>Clin</span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          textAlign: "center",
          marginTop: 24,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 32,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          Sistema completo para
          <br />
          gestão de clínicas
        </div>
      </div>

      {/* Badge */}
      <div
        style={{
          transform: `scale(${badgeScale})`,
          marginTop: 40,
          padding: "12px 32px",
          borderRadius: 40,
          background: "rgba(56,189,248,0.15)",
          border: "1px solid rgba(56,189,248,0.3)",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 20,
            color: "#38bdf8",
            fontWeight: 600,
          }}
        >
          ✦ Multi-especialidades
        </div>
      </div>
    </AbsoluteFill>
  );
};

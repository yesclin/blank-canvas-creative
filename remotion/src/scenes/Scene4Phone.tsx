import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

export const Scene4Phone = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const rotateY = interpolate(frame, [0, 75], [-15, 15]);
  const rotateX = interpolate(frame, [0, 75], [5, -5]);

  // Floating notification cards
  const notif1 = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const notif2 = spring({ frame: frame - 35, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Phone mockup with 3D transform */}
      <div
        style={{
          transform: `perspective(1200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${interpolate(phoneSpring, [0, 1], [0.6, 1])})`,
          opacity: phoneSpring,
          position: "relative",
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 360,
            height: 720,
            borderRadius: 48,
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            border: "3px solid rgba(255,255,255,0.1)",
            padding: 16,
            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(56,189,248,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Screen */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 36,
              background: "linear-gradient(180deg, #0f172a, #1e293b)",
              padding: 20,
              overflow: "hidden",
            }}
          >
            {/* Status bar */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 14, color: "white", fontWeight: 600 }}>9:41</div>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 16, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.5)" }} />
                <div style={{ width: 20, height: 10, borderRadius: 3, background: "#34d399" }} />
              </div>
            </div>

            {/* App header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 22, fontWeight: 700, color: "white" }}>
                Yes<span style={{ color: "#38bdf8" }}>Clin</span>
              </div>
              <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                Painel da clínica
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { n: "24", l: "Hoje", c: "#38bdf8" },
                { n: "156", l: "Pac.", c: "#818cf8" },
                { n: "89", l: "Pront.", c: "#34d399" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: `${s.c}15`,
                    borderRadius: 12,
                    padding: "10px 6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 700, color: s.c }}>{s.n}</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Appointments */}
            <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              Próximos atendimentos
            </div>
            {[
              { time: "09:00", name: "Maria Silva" },
              { time: "10:30", name: "João Santos" },
              { time: "14:00", name: "Ana Costa" },
              { time: "15:30", name: "Carlos Lima" },
            ].map((apt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 10,
                    color: "#38bdf8",
                    background: "rgba(56,189,248,0.15)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {apt.time}
                </div>
                <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "white" }}>{apt.name}</div>
                <div
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? "#34d399" : "#fbbf24",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating notification 1 */}
        <div
          style={{
            position: "absolute",
            top: 120,
            right: -100,
            transform: `translateX(${interpolate(notif1, [0, 1], [80, 0])}px) translateY(${Math.sin(frame * 0.08) * 6}px)`,
            opacity: notif1,
            background: "rgba(15,23,42,0.9)",
            borderRadius: 16,
            padding: "12px 18px",
            border: "1px solid rgba(52,211,153,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            ✓
          </div>
          <div>
            <div style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 600, color: "white" }}>Confirmado</div>
            <div style={{ fontFamily: "sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>há 2 min</div>
          </div>
        </div>

        {/* Floating notification 2 */}
        <div
          style={{
            position: "absolute",
            bottom: 180,
            left: -90,
            transform: `translateX(${interpolate(notif2, [0, 1], [-80, 0])}px) translateY(${Math.sin(frame * 0.07 + 2) * 5}px)`,
            opacity: notif2,
            background: "rgba(15,23,42,0.9)",
            borderRadius: 16,
            padding: "12px 18px",
            border: "1px solid rgba(56,189,248,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            📅
          </div>
          <div>
            <div style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 600, color: "white" }}>Novo agend.</div>
            <div style={{ fontFamily: "sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>agora</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

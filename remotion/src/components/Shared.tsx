import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, INTER } from "../theme";

/**
 * Animated brand background — soft white/blue gradient with subtle shapes.
 * Persistent across all scenes for visual continuity.
 */
export const BrandBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.white} 0%, ${COLORS.bgSoft} 55%, #E0F2FE 100%)`,
      }}
    >
      {/* Floating soft blobs */}
      {[
        { x: 0.15, y: 0.18, size: 380, color: COLORS.primary, alpha: 0.18, speed: 0.4 },
        { x: 0.85, y: 0.32, size: 300, color: COLORS.accent, alpha: 0.16, speed: 0.6 },
        { x: 0.2, y: 0.78, size: 320, color: COLORS.primaryDark, alpha: 0.12, speed: 0.5 },
        { x: 0.78, y: 0.86, size: 260, color: COLORS.primary, alpha: 0.14, speed: 0.7 },
      ].map((b, i) => {
        const drift = Math.sin((frame + i * 40) * 0.02 * b.speed) * 60;
        const driftY = Math.cos((frame + i * 60) * 0.018 * b.speed) * 50;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x * width - b.size / 2 + drift,
              top: b.y * height - b.size / 2 + driftY,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: b.color,
              opacity: b.alpha,
              filter: "blur(60px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Bottom progress bar across the whole video.
 */
export const ProgressBar: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: 8,
        background: "rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
        }}
      />
    </div>
  );
};

/**
 * Top brand chip — small persistent badge.
 */
export const BrandChip: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 60,
        opacity: fade,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 22px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 8px 24px rgba(14,165,233,0.18)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
        }}
      />
      <span
        style={{
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: 24,
          color: COLORS.ink,
          letterSpacing: -0.5,
        }}
      >
        YesClin
      </span>
    </div>
  );
};

/**
 * Big stacked caption used in every scene (title + optional subtitle).
 * Animates in with a spring + slide.
 */
export const Caption: React.FC<{
  title: string;
  subtitle?: string;
  position?: "top" | "bottom";
  accent?: boolean;
}> = ({ title, subtitle, position = "bottom", accent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const titleY = interpolate(enter, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const subEnter = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 140 } });
  const subY = interpolate(subEnter, [0, 1], [30, 0]);
  const subOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        ...(position === "bottom" ? { bottom: 200 } : { top: 220 }),
        textAlign: "left",
        fontFamily: INTER,
      }}
    >
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          fontWeight: 900,
          fontSize: 96,
          lineHeight: 1.02,
          color: COLORS.ink,
          letterSpacing: -3,
          textShadow: "0 2px 14px rgba(255,255,255,0.6)",
        }}
      >
        {accent ? (
          <span
            style={{
              background: `linear-gradient(120deg, ${COLORS.primary}, ${COLORS.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </span>
        ) : (
          title
        )}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 22,
            transform: `translateY(${subY}px)`,
            opacity: subOpacity,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.inkSoft,
            letterSpacing: -0.5,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/**
 * Phone-like frame that holds a "system screenshot" image, with a
 * gentle zoom and parallax. Renders centered.
 */
export const ScreenMockup: React.FC<{
  src: string;
  highlight?: { x: number; y: number; label?: string };
}> = ({ src, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  // Slow continuous zoom for life
  const zoom = interpolate(frame, [0, 90], [1, 1.05]);

  // Cursor click animation
  const clickPulse = highlight
    ? interpolate(
        Math.sin(frame * 0.18),
        [-1, 1],
        [0.6, 1.0]
      )
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          width: 880,
          height: 1100,
          borderRadius: 56,
          background: COLORS.white,
          boxShadow:
            "0 40px 80px rgba(2,132,199,0.25), 0 12px 30px rgba(15,23,42,0.18)",
          padding: 18,
          transform: `scale(${scale})`,
          overflow: "hidden",
          position: "relative",
          border: `1px solid rgba(14,165,233,0.15)`,
        }}
      >
        {/* Window chrome */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px",
            background: COLORS.bgSoft,
            borderRadius: 16,
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF6B6B" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFD166" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#06D6A0" }} />
          <div
            style={{
              marginLeft: 16,
              fontFamily: INTER,
              fontSize: 18,
              color: COLORS.muted,
              fontWeight: 600,
            }}
          >
            yesclin.app
          </div>
        </div>

        {/* Image area with zoom */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "calc(100% - 56px)",
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          <img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />

          {/* Cursor / click highlight */}
          {highlight && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: `${highlight.x}%`,
                  top: `${highlight.y}%`,
                  width: 60,
                  height: 60,
                  marginLeft: -30,
                  marginTop: -30,
                  borderRadius: "50%",
                  border: `4px solid ${COLORS.primary}`,
                  background: `rgba(14,165,233,${0.15 * clickPulse})`,
                  transform: `scale(${0.8 + clickPulse * 0.4})`,
                }}
              />
              {/* Cursor */}
              <svg
                width="36"
                height="46"
                viewBox="0 0 36 46"
                style={{
                  position: "absolute",
                  left: `${highlight.x}%`,
                  top: `${highlight.y}%`,
                  marginLeft: 10,
                  marginTop: 6,
                }}
              >
                <path
                  d="M2 2 L2 32 L11 24 L17 38 L22 36 L16 22 L28 22 Z"
                  fill={COLORS.ink}
                  stroke={COLORS.white}
                  strokeWidth="2"
                />
              </svg>
              {highlight.label && (
                <div
                  style={{
                    position: "absolute",
                    left: `${highlight.x}%`,
                    top: `${highlight.y}%`,
                    marginLeft: 60,
                    marginTop: 28,
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: COLORS.ink,
                    color: COLORS.white,
                    fontFamily: INTER,
                    fontWeight: 700,
                    fontSize: 22,
                    whiteSpace: "nowrap",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  }}
                >
                  {highlight.label}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

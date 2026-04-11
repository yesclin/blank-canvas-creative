import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Features } from "./scenes/Scene2Features";
import { Scene3Stats } from "./scenes/Scene3Stats";
import { Scene4Phone } from "./scenes/Scene4Phone";
import { Scene5CTA } from "./scenes/Scene5CTA";

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Animated gradient background
  const hueShift = interpolate(frame, [0, 360], [0, 30]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, 
          hsl(${210 + hueShift}, 85%, 12%) 0%, 
          hsl(${220 + hueShift}, 80%, 18%) 40%, 
          hsl(${200 + hueShift}, 75%, 22%) 70%,
          hsl(${230 + hueShift}, 85%, 14%) 100%)`,
      }}
    >
      {/* Floating particles layer */}
      <AbsoluteFill style={{ opacity: 0.3 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (i * 137) % 1080;
          const baseY = (i * 211) % 1920;
          const size = 4 + (i % 5) * 2;
          const speed = 0.3 + (i % 4) * 0.15;
          const y = baseY + Math.sin((frame * speed + i * 50) * 0.05) * 40;
          const opacity = interpolate(
            Math.sin(frame * 0.03 + i),
            [-1, 1],
            [0.2, 0.8]
          );
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: "50%",
                background: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#818cf8" : "#34d399",
                opacity,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={80}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={80}>
          <Scene2Features />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={75}>
          <Scene3Stats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={75}>
          <Scene4Phone />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

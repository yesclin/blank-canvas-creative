import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { BrandBackground, BrandChip, ProgressBar } from "./components/Shared";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Intro } from "./scenes/Scene2Intro";
import { Scene3Agenda } from "./scenes/Scene3Agenda";
import { Scene4Prontuario } from "./scenes/Scene4Prontuario";
import { Scene5Financeiro } from "./scenes/Scene5Financeiro";
import { Scene6Whatsapp } from "./scenes/Scene6Whatsapp";
import { Scene7Proof } from "./scenes/Scene7Proof";
import { Scene8CTA } from "./scenes/Scene8CTA";

export const FPS = 30;

// Per-scene durations (frames @30fps). Transitions overlap by 12f each (7 transitions * 12 = 84).
// Sum scenes 90+90+105+105+105+105+105+150 = 855
// Final = 855 - 84 = 771 frames ≈ 25.7s. Bumped scene 8 to land around ~28-30s comfortably.
const SCENE = {
  hook: 90,        // 3s
  intro: 90,       // 3s
  agenda: 105,     // 3.5s
  prontuario: 105, // 3.5s
  financeiro: 105, // 3.5s
  whatsapp: 105,   // 3.5s
  proof: 105,      // 3.5s
  cta: 150,        // 5s
};

const TRANSITION = 12;
const TOTAL_SCENE_FRAMES =
  SCENE.hook + SCENE.intro + SCENE.agenda + SCENE.prontuario +
  SCENE.financeiro + SCENE.whatsapp + SCENE.proof + SCENE.cta;
export const DURATION_FRAMES = TOTAL_SCENE_FRAMES - TRANSITION * 7;

const slideUp = slide({ direction: "from-bottom" });
const slideLeft = slide({ direction: "from-right" });
const fadeT = fade();
const wipeRight = wipe({ direction: "from-left" });

const t = (presentation: ReturnType<typeof fade>) => (
  <TransitionSeries.Transition
    presentation={presentation}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
);

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <BrandBackground />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE.hook}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        {t(fadeT)}
        <TransitionSeries.Sequence durationInFrames={SCENE.intro}>
          <Scene2Intro />
        </TransitionSeries.Sequence>
        {t(slideUp)}
        <TransitionSeries.Sequence durationInFrames={SCENE.agenda}>
          <Scene3Agenda />
        </TransitionSeries.Sequence>
        {t(slideLeft)}
        <TransitionSeries.Sequence durationInFrames={SCENE.prontuario}>
          <Scene4Prontuario />
        </TransitionSeries.Sequence>
        {t(slideLeft)}
        <TransitionSeries.Sequence durationInFrames={SCENE.financeiro}>
          <Scene5Financeiro />
        </TransitionSeries.Sequence>
        {t(slideLeft)}
        <TransitionSeries.Sequence durationInFrames={SCENE.whatsapp}>
          <Scene6Whatsapp />
        </TransitionSeries.Sequence>
        {t(wipeRight)}
        <TransitionSeries.Sequence durationInFrames={SCENE.proof}>
          <Scene7Proof />
        </TransitionSeries.Sequence>
        {t(fadeT)}
        <TransitionSeries.Sequence durationInFrames={SCENE.cta}>
          <Scene8CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <BrandChip />
      <ProgressBar totalFrames={DURATION_FRAMES} />
    </AbsoluteFill>
  );
};

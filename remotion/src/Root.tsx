import { Composition } from "remotion";
import { MainVideo, FPS, DURATION_FRAMES } from "./MainVideo";

export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={DURATION_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

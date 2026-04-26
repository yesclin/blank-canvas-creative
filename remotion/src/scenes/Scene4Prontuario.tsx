import { AbsoluteFill, staticFile } from "remotion";
import { Caption, ScreenMockup } from "../components/Shared";

// CENA 4 — Prontuário completo
export const Scene4Prontuario: React.FC = () => {
  return (
    <AbsoluteFill>
      <ScreenMockup src={staticFile("images/screen-prontuario.jpg")} />
      <Caption title="Prontuário completo" subtitle="Histórico clínico em um clique" position="bottom" accent />
    </AbsoluteFill>
  );
};

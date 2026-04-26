import { AbsoluteFill, staticFile } from "remotion";
import { Caption, ScreenMockup } from "../components/Shared";

// CENA 5 — Controle financeiro
export const Scene5Financeiro: React.FC = () => {
  return (
    <AbsoluteFill>
      <ScreenMockup src={staticFile("images/screen-financeiro.jpg")} />
      <Caption title="Controle financeiro" subtitle="Caixa, recebimentos e relatórios" position="bottom" accent />
    </AbsoluteFill>
  );
};

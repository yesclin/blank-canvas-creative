import { AbsoluteFill, staticFile } from "remotion";
import { Caption, ScreenMockup } from "../components/Shared";

// CENA 3 — Agenda inteligente
export const Scene3Agenda: React.FC = () => {
  return (
    <AbsoluteFill>
      <ScreenMockup
        src={staticFile("images/screen-agenda.jpg")}
        highlight={{ x: 55, y: 50, label: "Nova consulta" }}
      />
      <Caption title="Agenda inteligente" subtitle="Tudo organizado em segundos" position="bottom" accent />
    </AbsoluteFill>
  );
};

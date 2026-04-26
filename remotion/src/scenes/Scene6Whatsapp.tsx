import { AbsoluteFill, staticFile } from "remotion";
import { Caption, ScreenMockup } from "../components/Shared";

// CENA 6 — Automação e WhatsApp
export const Scene6Whatsapp: React.FC = () => {
  return (
    <AbsoluteFill>
      <ScreenMockup
        src={staticFile("images/screen-whatsapp.jpg")}
        highlight={{ x: 78, y: 78, label: "Enviar" }}
      />
      <Caption title="Automação + WhatsApp" subtitle="Lembretes e mensagens prontas" position="bottom" accent />
    </AbsoluteFill>
  );
};

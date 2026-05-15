import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const bullets = [
  "Sistema completo com tudo o que você precisa em um só lugar",
  "Agenda inteligente para marcação fácil e automatizada",
  "Prontuário digital com registros completos e acessíveis",
  "Financeiro integrado com controle total de receitas e despesas",
  "Assistente virtual no WhatsApp que automatiza agendamentos com IA",
];

const HeroLead = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState("");
  const [team, setTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Preencha nome, e-mail e celular para continuar.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Recebemos seu contato! Em breve um especialista falará com você.");
      setName(""); setEmail(""); setPhone(""); setChallenge(""); setTeam("");
    }, 600);
  };

  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      <div className="absolute inset-0 pattern-grid opacity-50" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10 pt-32 lg:pt-36 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy + bullets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles size={14} /> Gestão 360° para clínicas e consultórios
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              O sistema que vai <span className="text-gradient-brand">impulsionar</span> a gestão da sua clínica
            </h1>
            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-foreground/80">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check size={12} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/criar-conta">
                  Crie sua conta grátis <ArrowRight size={20} />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="#features">Ver recursos</a>
              </Button>
            </div>
          </motion.div>

          {/* Right: lead form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-3xl border border-border/60 shadow-xl p-6 lg:p-8"
          >
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Falar com um especialista</p>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Montamos uma proposta personalizada para você
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Para agilizar seu atendimento, precisamos saber:
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hl-name">Nome*</Label>
                  <Input id="hl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hl-email">E-mail*</Label>
                  <Input id="hl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@clinica.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hl-phone">Celular*</Label>
                <Input id="hl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Qual o maior desafio de gestão da sua clínica hoje?</Label>
                <Select value={challenge} onValueChange={setChallenge}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agenda">Organizar a agenda</SelectItem>
                    <SelectItem value="prontuario">Padronizar prontuários</SelectItem>
                    <SelectItem value="financeiro">Controlar o financeiro</SelectItem>
                    <SelectItem value="marketing">Atrair e fidelizar pacientes</SelectItem>
                    <SelectItem value="estoque">Controle de estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantas pessoas terão acesso ao sistema?</Label>
                <Select value={team} onValueChange={setTeam}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Apenas eu</SelectItem>
                    <SelectItem value="2-5">2 a 5</SelectItem>
                    <SelectItem value="6-15">6 a 15</SelectItem>
                    <SelectItem value="15+">Mais de 15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Enviando..." : "Continuar"} <ArrowRight size={18} />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao continuar você concorda com nossa <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroLead;

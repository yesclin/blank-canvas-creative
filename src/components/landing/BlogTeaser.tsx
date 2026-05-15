import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

export const blogPosts = [
  {
    slug: "gestao-clinica-100-digital",
    title: "Como tornar a gestão da sua clínica 100% digital em 30 dias",
    excerpt:
      "Um guia prático para migrar do papel para um sistema unificado sem perder produtividade no caminho.",
    category: "Gestão",
    date: "12 de maio, 2026",
    readTime: "7 min",
    cover: "from-primary/20 to-accent/20",
  },
  {
    slug: "ia-no-prontuario",
    title: "IA no prontuário: o que muda na rotina do profissional de saúde",
    excerpt:
      "Transcrição automática, sugestão de hipóteses e mais tempo olhando para o paciente. Veja como aplicar.",
    category: "Tecnologia",
    date: "05 de maio, 2026",
    readTime: "6 min",
    cover: "from-accent/30 to-primary/10",
  },
  {
    slug: "lgpd-na-clinica",
    title: "LGPD na clínica: checklist essencial para evitar multas",
    excerpt:
      "Consentimento, base legal, retenção e auditoria — o passo a passo para estar 100% em conformidade.",
    category: "Compliance",
    date: "28 de abril, 2026",
    readTime: "9 min",
    cover: "from-primary/15 to-success/15",
  },
  {
    slug: "no-show-zero",
    title: "No-show zero: 8 estratégias que reduzem faltas em até 60%",
    excerpt:
      "Lembretes pelo WhatsApp, confirmação automática, lista de espera e outras táticas comprovadas.",
    category: "Operação",
    date: "20 de abril, 2026",
    readTime: "5 min",
    cover: "from-warning/20 to-primary/10",
  },
  {
    slug: "marketing-para-clinicas",
    title: "Marketing para clínicas: do primeiro contato ao paciente fiel",
    excerpt:
      "CRM, jornadas automáticas e métricas que importam para crescer com previsibilidade.",
    category: "Marketing",
    date: "10 de abril, 2026",
    readTime: "8 min",
    cover: "from-accent/20 to-primary/20",
  },
  {
    slug: "estoque-clinico-fefo",
    title: "Estoque clínico com FEFO: como acabar com perdas e rupturas",
    excerpt:
      "Controle por lote, validade e consumo por atendimento. O método FEFO aplicado na sua clínica.",
    category: "Estoque",
    date: "02 de abril, 2026",
    readTime: "6 min",
    cover: "from-success/15 to-primary/10",
  },
];

const PostCard = ({ post }: { post: (typeof blogPosts)[number] }) => (
  <article className="group bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
    <div className={`h-44 bg-gradient-to-br ${post.cover} relative`}>
      <span className="absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/90 text-foreground">
        {post.category}
      </span>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Calendar size={12} /> {post.date} · {post.readTime} de leitura
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
      <Link
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
      >
        Ler artigo <ArrowRight size={14} />
      </Link>
    </div>
  </article>
);

export const BlogTeaser = () => {
  const featured = blogPosts.slice(0, 3);
  return (
    <section id="blog" className="py-20 bg-background">
      <div className="section-container">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-2">Conteúdos</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Blog Yesclin
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Artigos, guias e tendências para você crescer com gestão, tecnologia e cuidado.
            </p>
          </div>
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog">Ver todos os artigos <ArrowRight size={16} /></Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </div>
    </section>
  );
};

export default PostCard;

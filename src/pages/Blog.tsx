import { useParams, Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import PostCard, { blogPosts } from "@/components/landing/BlogTeaser";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

const BlogIndex = () => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(blogPosts.map((p) => p.category))),
    [],
  );

  const filtered = blogPosts.filter((p) => {
    const matchesQ =
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(q.toLowerCase());
    const matchesCat = !cat || p.category === cat;
    return matchesQ && matchesCat;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="section-container">
          <div className="max-w-3xl mb-10">
            <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-2">Conteúdos</p>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-foreground">
              Blog <span className="text-gradient-brand">Yesclin</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-3">
              Estratégias, tendências e boas práticas para clínicas que querem crescer com tecnologia.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar artigos..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCat(null)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  !cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">Nenhum artigo encontrado.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => <PostCard key={p.slug} post={p} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20">
          <div className="section-container text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Artigo não encontrado</h1>
            <Button variant="outline" asChild>
              <Link to="/blog"><ArrowLeft size={16} /> Voltar ao blog</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <article className="section-container max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={14} /> Voltar ao blog
          </Link>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-4">
            {post.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4">
            {post.title}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Calendar size={14} /> {post.date} · {post.readTime} de leitura
          </p>
          <div className={`h-64 rounded-3xl bg-gradient-to-br ${post.cover} mb-10`} />
          <div className="max-w-none text-foreground/90 leading-relaxed space-y-5">
            <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            {post.body?.map((block, i) => {
              if (block.type === "h2")
                return (
                  <h2 key={i} className="font-display text-2xl lg:text-3xl font-bold text-foreground mt-10 mb-2">
                    {block.text}
                  </h2>
                );
              if (block.type === "ul")
                return (
                  <ul key={i} className="list-disc pl-6 space-y-2 text-foreground/90">
                    {block.items.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                );
              if (block.type === "quote")
                return (
                  <blockquote key={i} className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6">
                    {block.text}
                  </blockquote>
                );
              return <p key={i} className="text-base lg:text-lg">{block.text}</p>;
            })}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export { BlogIndex, BlogPost };
export default BlogIndex;

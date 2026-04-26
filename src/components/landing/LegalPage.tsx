import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const LegalPage = ({ title, subtitle, children }: LegalPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="section-container py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            YesClin
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft size={16} />
              Voltar ao site
            </Link>
          </Button>
        </div>
      </header>
      <main className="section-container max-w-3xl py-12 lg:py-16">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground mb-8">{subtitle}</p>
        )}
        <div className="prose prose-slate max-w-none text-foreground/90 leading-relaxed space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LegalPage;

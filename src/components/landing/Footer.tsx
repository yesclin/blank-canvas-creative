import { Link } from "react-router-dom";
import logoFull from "@/assets/logo-full.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    produto: [
      { label: "Recursos", href: "#features" },
      { label: "Especialidades", href: "#specialties" },
      { label: "Preços", href: "#pricing" },
    ],
    empresa: [
      { label: "Sobre", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contato", href: "#" },
    ],
    legal: [
      { label: "Privacidade", href: "#" },
      { label: "Termos de Uso", href: "#" },
      { label: "LGPD", href: "#" },
    ],
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img src={logoFull} alt="Yesclin" className="h-8 object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              Sistema completo para gestão de clínicas e consultórios de saúde.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-background/80 mb-4">
              Produto
            </h4>
            <ul className="space-y-2">
              {links.produto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-background/80 mb-4">
              Empresa
            </h4>
            <ul className="space-y-2">
              {links.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-background/80 mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {currentYear} Yesclin. Todos os direitos reservados.
          </p>
          <p className="text-sm text-background/50">
            Feito com ❤️ para profissionais de saúde
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

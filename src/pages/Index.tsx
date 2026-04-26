import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Screenshots from "@/components/landing/Screenshots";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import Specialties from "@/components/landing/Specialties";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import FAQCta from "@/components/landing/FAQCta";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  // Se o usuário já estiver autenticado (incluindo logo após confirmar o e-mail),
  // redireciona automaticamente para o app.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) navigate("/app", { replace: true });
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate("/app", { replace: true });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Screenshots />
        <Features />
        <WhyChoose />
        <Specialties />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FAQCta />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

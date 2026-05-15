import Header from "@/components/landing/Header";
import HeroLead from "@/components/landing/HeroLead";
import Stats from "@/components/landing/Stats";
import Screenshots from "@/components/landing/Screenshots";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import Specialties from "@/components/landing/Specialties";
import Testimonials from "@/components/landing/Testimonials";
import Security from "@/components/landing/Security";
import Pricing from "@/components/landing/Pricing";
import { BlogTeaser } from "@/components/landing/BlogTeaser";
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

    const goTo = async (userId: string) => {
      try {
        const { data } = await supabase.rpc("is_platform_admin", { _user_id: userId });
        if (!mounted) return;
        navigate(data === true ? "/super-admin" : "/app", { replace: true });
      } catch {
        if (mounted) navigate("/app", { replace: true });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user?.id) void goTo(session.user.id);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user?.id) void goTo(data.session.user.id);
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
        <HeroLead />
        <Stats />
        <Screenshots />
        <Features />
        <WhyChoose />
        <Specialties />
        <Testimonials />
        <Security />
        <Pricing />
        <BlogTeaser />
        <FAQ />
        <FAQCta />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

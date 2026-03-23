import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global listener for PASSWORD_RECOVERY auth events.
 * When Supabase processes a recovery token from the URL,
 * this redirects the user to the password reset form.
 */
export const PasswordRecoveryHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're already on the reset page to avoid redirect loops
    if (location.pathname === "/redefinir-senha") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/redefinir-senha", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
};

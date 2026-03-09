import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && isMounted) {
        window.location.replace("/dashboard");
        return;
      }

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" && session) {
          window.location.replace("/dashboard");
        }
      });

      unsubscribe = () => data.subscription.unsubscribe();
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
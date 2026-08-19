import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type TenantIdentity = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Entra/Azure home tenant id when the user signed in with Microsoft. */
  tenantId: string | null;
  displayName: string;
  initials: string;
  provider: string;
};

function deriveName(user: User | null) {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (meta["full_name"] as string) || (meta["name"] as string) || user.email || "Signed in";
}

export function useAuth(): TenantIdentity {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const name = deriveName(user);
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;

  return {
    user,
    session,
    loading,
    tenantId: (meta["tid"] as string) ?? (meta["tenant_id"] as string) ?? null,
    displayName: name,
    initials:
      name
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "?",
    provider: (user?.app_metadata?.["provider"] as string) ?? "email",
  };
}

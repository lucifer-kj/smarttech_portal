import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/types";

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setSession, setLoading } =
    useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const authUser = session.user;
          const appMeta = (authUser.app_metadata || {}) as Record<string, unknown>;
          const userMeta = (authUser.user_metadata || {}) as Record<string, unknown>;

          let role = (appMeta.role as string) || (userMeta.role as string) || "";
          const sm8_uuid = (appMeta.sm8_uuid as string) || (userMeta.sm8_uuid as string) || null;
          const is_banned = Boolean((appMeta.is_banned as boolean) ?? (userMeta.is_banned as boolean) ?? false);
          const first_login_complete = Boolean(
            (appMeta.first_login_complete as boolean) ?? (userMeta.first_login_complete as boolean) ?? false
          );

          // Fallback: if role missing, check admin allowlist by email
          if (!role) {
            const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
              .split(",")
              .map(e => e.trim().toLowerCase())
              .filter(Boolean)
            if (authUser.email && allowlist.includes(authUser.email.toLowerCase())) {
              role = "admin"
            }
          }

          const mappedUser: User = {
            id: authUser.id,
            email: authUser.email || "",
            sm8_uuid,
            role: role === "admin" ? "admin" : "client",
            is_banned,
            first_login_complete,
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setUser(mappedUser);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (event === "SIGNED_IN" && session?.user) {
        const authUser = session.user;
        const appMeta = (authUser.app_metadata || {}) as Record<string, unknown>;
        const userMeta = (authUser.user_metadata || {}) as Record<string, unknown>;

        let role = (appMeta.role as string) || (userMeta.role as string) || "";
        const sm8_uuid = (appMeta.sm8_uuid as string) || (userMeta.sm8_uuid as string) || null;
        const is_banned = Boolean((appMeta.is_banned as boolean) ?? (userMeta.is_banned as boolean) ?? false);
        const first_login_complete = Boolean(
          (appMeta.first_login_complete as boolean) ?? (userMeta.first_login_complete as boolean) ?? false
        );

        // Fallback: if role missing, check admin allowlist by email
        if (!role) {
          const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map(e => e.trim().toLowerCase())
            .filter(Boolean)
          if (authUser.email && allowlist.includes(authUser.email.toLowerCase())) {
            role = "admin"
          }
        }

        const mappedUser: User = {
          id: authUser.id,
          email: authUser.email || "",
          sm8_uuid,
          role: role === "admin" ? "admin" : "client",
          is_banned,
          first_login_complete,
          created_at: authUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUser(mappedUser);
        setSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, isHydrated]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

export function useFirstLoginWalkthrough() {
  const { user } = useAuth();
  
  return {
    shouldShowWalkthrough: user && !user.first_login_complete,
    isFirstLogin: user && !user.first_login_complete,
  };
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized: isAuthenticated && !user?.is_banned,
  };
}

export function useRequireAdmin() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: isAuthenticated && user?.role === "admin" && !user?.is_banned,
  };
}

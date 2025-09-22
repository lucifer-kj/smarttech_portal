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
          // Fetch user data from our users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user data:", userError);
            setLoading(false);
            return;
          }

          setUser(userData as User);
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
        // Fetch user data
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && userData) {
          setUser(userData as User);
          setSession(session);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);

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

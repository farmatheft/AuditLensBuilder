import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initTelegramAuth: () => Promise<void>;
  userId: number | null;
}

// Helper to get Telegram WebApp
const getTelegramWebApp = () => {
  if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      isLoading: true,
      error: null,
      setUser: (user) => set({ user, userId: user ? user.id : null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      initTelegramAuth: async () => {
        set({ isLoading: true, error: null });
        const tg = getTelegramWebApp();

        if (!tg) {
          // If not in Telegram, maybe in dev mode?
          if (import.meta.env.DEV) {
            console.log("Dev mode: Attempting to use dev user");
            try {
              const res = await fetch("/api/auth/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: "dev" }),
              });
              
              if (res.ok) {
                const user = await res.json();
                set({ user, userId: user.id, isLoading: false });
                return;
              }
            } catch (e) {
               console.error("Failed dev auth", e);
            }
          }
          
          set({ 
            isLoading: false, 
            error: "Telegram WebApp not available. Please open in Telegram." 
          });
          return;
        }

        tg.ready();
        const initData = tg.initData;

        if (!initData) {
            // If in dev mode and opened via direct link without initData, try dev auth
             if (import.meta.env.DEV) {
                console.log("Dev mode (Telegram available but no initData): Attempting to use dev user");
                try {
                  const res = await fetch("/api/auth/telegram", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData: "dev" }),
                  });
                  
                  if (res.ok) {
                    const user = await res.json();
                    set({ user, userId: user.id, isLoading: false });
                    return;
                  }
                } catch (e) {
                   console.error("Failed dev auth", e);
                }
            }
            
            set({ isLoading: false, error: "No Telegram init data found." });
            return;
        }

        try {
          const res = await fetch("/api/auth/telegram", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ initData }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Authentication failed");
          }

          const user = await res.json();
          set({ user, userId: user.id, isLoading: false });
          
          // Expand the WebApp
          tg.expand();
          
        } catch (err: any) {
          set({ 
            isLoading: false, 
            error: err.message || "Failed to authenticate with Telegram" 
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, userId: state.userId }), // Persist user info
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
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
      isDemo: false,
      setUser: (user) => set({ user, userId: user ? user.id : null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      initTelegramAuth: async () => {
        set({ isLoading: true, error: null });
        const tg = getTelegramWebApp();

        if (!tg || !tg.initData) {
          console.log("Running in demo mode");
          set({ 
            user: {
              id: 1,
              telegramId: "1",
              firstName: "Demo",
              lastName: "User",
              username: "demouser",
              isBot: false,
              languageCode: "en",
              createdAt: new Date().toISOString(),
            },
            userId: 1,
            isLoading: false, 
            isDemo: true,
            error: "Running in demo mode. Please open in Telegram for full functionality." 
          });
          return;
        }

        tg.ready();
        const initData = tg.initData;

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
          set({ user, userId: user.id, isLoading: false, isDemo: false });
          
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
      partialize: (state) => ({ user: state.user, userId: state.userId, isDemo: state.isDemo }), // Persist user info
    }
  )
);
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface TelegramSession {
  sessionString: string | null;
  username: string | null;
  isLoading: boolean;
}

export function useTelegramSession() {
  const { userId } = useAuth();
  const [session, setSession] = useState<TelegramSession>({
    sessionString: null,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    async function checkSession() {
      if (!userId) return;

      try {
        const response = await fetch("/api/telegram/session");
        const data = await response.json();

        if (response.ok && data.session) {
          setSession({
            sessionString: data.session.sessionString,
            username: data.session.username,
            isLoading: false,
          });
        } else {
          setSession({
            sessionString: null,
            username: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setSession({
          sessionString: null,
          username: null,
          isLoading: false,
        });
      }
    }

    checkSession();
  }, [userId]);

  return session;
} 
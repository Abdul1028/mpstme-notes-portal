"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function TelegramSessionManager() {
  const [sessionString, setSessionString] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save session");
      }

      toast.success("Telegram session connected successfully!");
      setSessionString("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="session" className="text-sm font-medium">
          Telegram Session String
        </label>
        <Input
          id="session"
          value={sessionString}
          onChange={(e) => setSessionString(e.target.value)}
          placeholder="Enter your Telegram session string"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Connecting..." : "Connect Telegram"}
      </Button>
    </form>
  );
}
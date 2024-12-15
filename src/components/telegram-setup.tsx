"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TelegramSessionManager } from "./telegram-session-manager";
import { useTelegramSession } from "@/hooks/use-telegram-session";
import { Loader2 } from "lucide-react";

export function TelegramSetup() {
  const { sessionString, username, isLoading } = useTelegramSession();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSession = async () => {
    setIsGenerating(true);
    try {
      // Open the session generation script in a new window
      window.open("/generate-session", "_blank");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sessionString) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Connected</CardTitle>
          <CardDescription>
            You are connected to Telegram as {username}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleGenerateSession}>
            Reconnect Telegram
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Telegram</CardTitle>
        <CardDescription>
          You need to connect your Telegram account to use this app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Step 1: Generate Session</h3>
            <p className="text-sm text-muted-foreground">
              First, generate a session string by running the Telegram login script
            </p>
            <Button
              onClick={handleGenerateSession}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Session"
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 2: Connect Session</h3>
            <p className="text-sm text-muted-foreground">
              Once you have your session string, paste it below to connect
            </p>
            <TelegramSessionManager />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GenerateSessionPage() {
  useEffect(() => {
    // Run the session generation script
    fetch("/api/telegram/generate-session")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log("Session generated:", data.sessionString);
        }
      })
      .catch(error => {
        console.error("Failed to generate session:", error);
      });
  }, []);

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Telegram Session</CardTitle>
          <CardDescription>
            Follow the instructions in your terminal to complete the login process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open your terminal</li>
            <li>Run <code>npm run generate-session</code></li>
            <li>Enter your phone number when prompted</li>
            <li>Enter the verification code sent to your Telegram</li>
            <li>Copy the session string that appears</li>
            <li>Return to the settings page and paste the session string</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 
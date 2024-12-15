"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { channelStore } from "@/lib/store";
import { toast } from "sonner";

export function SubjectManager() {
  const [newSubject, setNewSubject] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubject = async () => {
    if (!newSubject.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    if (channelStore.hasSubject(newSubject)) {
      toast.error("This subject already exists");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createFolders",
          data: {
            subjects: [newSubject],
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subject");
      }

      toast.success("Subject created successfully!");
      setNewSubject("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create subject");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <Input
        placeholder="Enter new subject name"
        value={newSubject}
        onChange={(e) => setNewSubject(e.target.value)}
        disabled={isCreating}
      />
      <Button onClick={handleCreateSubject} disabled={isCreating}>
        {isCreating ? "Creating..." : "Create Subject"}
      </Button>
    </div>
  );
} 
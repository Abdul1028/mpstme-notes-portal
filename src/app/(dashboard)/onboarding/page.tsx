"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSubjectFolders } from "@/lib/telegram";
import { toast } from "sonner";
import { channelStore } from "@/lib/store";

// Predefined subjects for MPSTME
const SUGGESTED_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "Electronics",
  "Data Structures",
  "Database Management",
  // Add more subjects as needed
];

export default function OnboardingPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject("");
    }
  };

  const addSuggestedSubject = (subject: string) => {
    if (!subjects.includes(subject)) {
      setSubjects([...subjects, subject]);
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Create folders for all subjects at once
      const result = await createSubjectFolders(subjects);
      
      console.log('Onboarding result:', result); // Debug log

      if (result.success) {
        console.log('Setting channels:', result.results); // Debug log
        // Store channel information
        channelStore.setChannels(result.results);
        console.log('Channels after setting:', channelStore.getAllSubjects()); // Debug log
        
        toast.success("Subject folders created successfully!");
        router.push("/dashboard");
      } else {
        throw new Error("Failed to create subject folders");
      }
    } catch (error) {
      console.error("Error during onboarding:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set up subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubjects = async () => {
    try {
      setIsCreating(true);
      // Clear existing channels before creating new ones
      channelStore.clearStore();
      
      const result = await createSubjectFolders(selectedSubjects);
      if (result.success) {
        toast.success("Subjects created successfully!");
        router.push("/notes");
      } else {
        throw new Error("Failed to create subjects");
      }
    } catch (error) {
      console.error('Error creating subjects:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create subjects");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to MPSTME Notes</CardTitle>
          <CardDescription>
            Select your subjects to get started. We'll create organized folders for each subject.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add a subject (e.g., Mathematics)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
            <Button onClick={addSubject} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggested Subjects */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Suggested Subjects:</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SUBJECTS.filter(subject => !subjects.includes(subject)).map((subject) => (
                <Button
                  key={subject}
                  variant="outline"
                  size="sm"
                  onClick={() => addSuggestedSubject(subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Subjects */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Subjects:</h3>
            <div className="space-y-2">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span>{subject}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubject(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={subjects.length === 0 || isLoading}
          >
            {isLoading ? "Setting up..." : "Continue to Dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
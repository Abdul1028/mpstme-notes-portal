"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const SUBJECTS = [
  "Advanced Java",
  "Software Engineering",
  "Mobile Application Development",
  "Human Computer Interface",
  "Data Analytics with Python",
  "Probability Statistics",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subjects: selectedSubjects }),
      });

      if (!response.ok) throw new Error("Failed to save subjects");

      toast.success("Subjects saved successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving subjects:", error);
      toast.error("Failed to save subjects");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SUBJECTS.map((subject) => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={subject}
                checked={selectedSubjects.includes(subject)}
                onCheckedChange={(checked) => {
                  setSelectedSubjects(
                    checked
                      ? [...selectedSubjects, subject]
                      : selectedSubjects.filter((s) => s !== subject)
                  );
                }}
              />
              <label htmlFor={subject} className="text-sm font-medium leading-none">
                {subject}
              </label>
            </div>
          ))}
          <Button 
            className="w-full mt-4" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";

const SUBJECTS = [
  {
    name: "Advanced Java",
    description: "Object-oriented programming and advanced Java concepts",
    icon: "🚀",
  },
  {
    name: "Software Engineering",
    description: "Software development lifecycle and best practices",
    icon: "⚙️",
  },
  {
    name: "Mobile Application Development",
    description: "Building mobile apps for iOS and Android",
    icon: "📱",
  },
  {
    name: "Human Computer Interface",
    description: "User experience and interface design principles",
    icon: "🎨",
  },
  {
    name: "Data Analytics with Python",
    description: "Data analysis and visualization using Python",
    icon: "📊",
  },
  {
    name: "Probability Statistics",
    description: "Statistical analysis and probability theory",
    icon: "📈",
  },
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl py-12">
        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-8 pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to MPSTME Notes</CardTitle>
            <CardDescription className="text-lg mt-2">
              Select your subjects to get started with your personalized learning experience
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Subjects Selection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Choose Your Subjects</CardTitle>
            </div>
            <CardDescription>
              Select the subjects you're currently studying. You can update these later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {SUBJECTS.map((subject) => (
                <Card
                  key={subject.name}
                  className={`relative overflow-hidden transition-colors ${
                    selectedSubjects.includes(subject.name)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{subject.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{subject.name}</h3>
                          <Checkbox
                            checked={selectedSubjects.includes(subject.name)}
                            onCheckedChange={(checked) => {
                              setSelectedSubjects(
                                checked
                                  ? [...selectedSubjects, subject.name]
                                  : selectedSubjects.filter((s) => s !== subject.name)
                              );
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  "Continue to Dashboard"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, Loader2, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_SUBJECTS = [
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

export default function SettingsPage() {
  const { userId } = useAuth();
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{ index: number; name: string } | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchUserSubjects = async () => {
      try {
        const response = await fetch("/api/user-subjects");
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const subjects = await response.json();
        setUserSubjects(subjects);
      } catch (error) {
        console.error("Error fetching user subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserSubjects();
    }
  }, [userId]);

  const handleJoinSubjects = async () => {
    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subjects: selectedSubjects }),
      });

      if (!response.ok) throw new Error("Failed to join subjects");

      setUserSubjects([...userSubjects, ...selectedSubjects]);
      setSelectedSubjects([]);
      toast.success("Successfully joined new subjects!");
    } catch (error) {
      console.error("Error joining subjects:", error);
      toast.error("Failed to join subjects");
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteClick = (index: number, subject: string) => {
    setSubjectToDelete({ index, name: subject });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subjectToDelete) return;

    try {
      const response = await fetch(`/api/subjects/${encodeURIComponent(subjectToDelete.name)}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove subject");

      setUserSubjects(userSubjects.filter((_, i) => i !== subjectToDelete.index));
      toast.success("Subject removed successfully");
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Failed to remove subject");
    } finally {
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
    }
  };

  const availableSubjects = ALL_SUBJECTS.filter(
    subject => !userSubjects.includes(subject.name)
  );

  return (
    <>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="subjects" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            {/* Current Subjects */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Your Subjects</CardTitle>
                <CardDescription>
                  Subjects you are currently enrolled in
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : userSubjects.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No subjects added yet
                    </div>
                  ) : (
                    userSubjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-2 sm:p-3"
                      >
                        <span className="text-sm sm:text-base truncate mr-2">{subject}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(index, subject)}
                          className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Subjects */}
            {availableSubjects.length > 0 && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Join New Subjects</CardTitle>
                  <CardDescription>
                    Select additional subjects to join
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                    {availableSubjects.map((subject) => (
                      <Card
                        key={subject.name}
                        className={`relative overflow-hidden transition-colors ${
                          selectedSubjects.includes(subject.name)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="text-xl sm:text-2xl">{subject.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">
                                  {subject.name}
                                </h3>
                                <Checkbox
                                  checked={selectedSubjects.includes(subject.name)}
                                  onCheckedChange={(checked) => {
                                    setSelectedSubjects(
                                      checked
                                        ? [...selectedSubjects, subject.name]
                                        : selectedSubjects.filter((s) => s !== subject.name)
                                    );
                                  }}
                                  className="flex-shrink-0"
                                />
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {subject.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedSubjects.length > 0 && (
                    <div className="mt-6">
                      <Button
                        onClick={handleJoinSubjects}
                        disabled={isJoining}
                        className="w-full sm:w-auto"
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Join Selected
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs> 
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Subject
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You will be removed from this subject and you will lose all your data related to{" "}
              <span className="font-semibold">{subjectToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep my data</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, X, Loader2, AlertTriangle } from "lucide-react";
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

export default function SettingsPage() {
  const { userId } = useAuth();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{ index: number; name: string } | null>(null);

  useEffect(() => {
    const fetchUserSubjects = async () => {
      try {
        const response = await fetch("/api/user-subjects");
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const subjects = await response.json();
        setSubjects(subjects);
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

  const addSubject = async () => {
    if (newSubject && !subjects.includes(newSubject)) {
      try {
        const response = await fetch("/api/subjects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subjects: [newSubject] }),
        });

        if (!response.ok) throw new Error("Failed to add subject");

        setSubjects([...subjects, newSubject]);
        setNewSubject("");
        toast.success("Subject added successfully");
      } catch (error) {
        console.error("Error adding subject:", error);
        toast.error("Failed to add subject");
      }
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

      setSubjects(subjects.filter((_, i) => i !== subjectToDelete.index));
      toast.success("Subject removed successfully");
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Failed to remove subject");
    } finally {
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="subjects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Subjects</CardTitle>
                <CardDescription>
                  Add or remove subjects to organize your notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubject()}
                  />
                  <Button onClick={addSubject} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No subjects added yet
                    </div>
                  ) : (
                    subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span>{subject}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(index, subject)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Update your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add notification settings here */}
              </CardContent>
            </Card>
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
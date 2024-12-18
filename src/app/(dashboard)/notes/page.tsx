"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/nextjs";

export default function NotesPage() {
  const { userId } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'Theory' | 'Practical'>('Theory');
  const [userSubjects, setUserSubjects] = useState<{ subject: string; channelId: string }[]>([]);

  useEffect(() => {
    const fetchUserSubjects = async () => {
      try {
        const response = await fetch("/api/user-subjects");
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const subjects = await response.json();
        console.log("Fetched subjects:", subjects);
        setUserSubjects(subjects);
      } catch (error) {
        console.error("Error fetching user subjects:", error);
        toast.error("Failed to load subjects");
      }
    };

    fetchUserSubjects();
  }, [userId]);

  const handleFileUpload = async (file: File) => {
    try {
      if (!selectedSubject || !userId) {
        toast.error("Please select a subject first");
        return;
      }
      
      // Placeholder for file upload
      toast.success("File upload simulation successful!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload file");
    }
  };

  const uniqueSubjects = Array.from(new Set(userSubjects.map(item => item.subject))); // Remove duplicates

  return (
    <div className="container py-6">
      <div className="flex gap-4 mb-6">
        <Select onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={uploadType} onValueChange={(value: 'Theory' | 'Practical') => setUploadType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Theory">Theory</SelectItem>
            <SelectItem value="Practical">Practical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {selectedSubject && (
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Select a subject and type to view files
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Joined Channels:</h3>
                <ul>
                  {userSubjects
                    .filter(subject => subject.subject === selectedSubject)
                    .map(({ channelId }) => (
                      <li key={channelId}>{channelId}</li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
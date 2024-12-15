"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Upload } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/file-upload";
import { telegramService } from "@/lib/telegram";
import { toast } from "sonner";
import { SubjectSelector } from "@/components/subject-selector";
import { channelStore } from "@/lib/store";

export default function NotesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'Lectures' | 'Assignments' | 'Study Materials'>('Lectures');

  const notes = [
    {
      id: 1,
      title: "Chapter 1: Introduction to Calculus",
      subject: "Mathematics",
      date: "2024-02-20",
    },
    {
      id: 2,
      title: "Data Structures and Algorithms",
      subject: "Computer Science",
      date: "2024-02-19",
    },
    // Add more notes
  ];

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      if (!selectedSubject) {
        toast.error("Please select a subject first");
        return;
      }

      const channelId = channelStore.getChannelId(selectedSubject, uploadType);
      
      if (!channelId) {
        toast.error("Channel not found for selected subject");
        return;
      }

      await telegramService.uploadFile(channelId, file);
      toast.success("File uploaded successfully!");
      
      // Refresh the notes list
      // You'll need to implement this
      refreshNotes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notes</h2>
          <p className="text-muted-foreground">
            View and manage all your notes
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Notes
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SubjectSelector onSelect={(subject) => setSelectedSubject(subject)} />
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as typeof uploadType)}
          className="border rounded-md p-2"
        >
          <option value="Lectures">Lectures</option>
          <option value="Assignments">Assignments</option>
          <option value="Study Materials">Study Materials</option>
        </select>
      </div>

      {selectedSubject && (
        <FileUpload onUpload={handleFileUpload} />
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notes..." className="pl-8" />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {note.title}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <p>{note.subject}</p>
                  <p>Updated {formatDate(note.date)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 
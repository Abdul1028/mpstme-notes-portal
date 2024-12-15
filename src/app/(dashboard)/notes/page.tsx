"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { telegramService } from "@/lib/telegram";
import { toast } from "sonner";
import { SubjectSelector } from "@/components/subject-selector";
import { channelStore } from "@/lib/store";
import { FileList } from "@/components/file-list";
import { SubjectManager } from "@/components/subject-manager";

export default function NotesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'Lectures' | 'Assignments' | 'Study Materials'>('Lectures');
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    const channelId = channelStore.getChannelId(subject, uploadType);
    console.log('Selected subject:', subject, 'Type:', uploadType, 'Channel ID:', channelId);
    setSelectedChannelId(channelId);
  };

  const handleTypeChange = (type: typeof uploadType) => {
    setUploadType(type);
    if (selectedSubject) {
      const channelId = channelStore.getChannelId(selectedSubject, type);
      console.log('Changed type:', type, 'Subject:', selectedSubject, 'Channel ID:', channelId);
      setSelectedChannelId(channelId);
    }
  };

  // Debug logging of channel store on mount
  useEffect(() => {
    console.log('Available subjects:', channelStore.getAllSubjects());
    channelStore.logChannels();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      if (!selectedSubject) {
        toast.error("Please select a subject first");
        return;
      }

      const channelId = channelStore.getChannelId(selectedSubject, uploadType);
      console.log('Uploading to channel ID:', channelId);
      
      if (!channelId) {
        toast.error("Channel not found for selected subject");
        return;
      }

      await telegramService.uploadFile(channelId, file);
      toast.success("File uploaded successfully!");
      
      // Force refresh of the FileList component by changing the key
      setSelectedChannelId(null);
      setTimeout(() => setSelectedChannelId(channelId), 100);
    } catch (error) {
      console.error('Upload error:', error);
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
      </div>

      <div className="flex items-center gap-4">
        <SubjectSelector onSelect={handleSubjectSelect} />
        <select
          value={uploadType}
          onChange={(e) => handleTypeChange(e.target.value as typeof uploadType)}
          className="border rounded-md p-2"
        >
          <option value="Lectures">Lectures</option>
          <option value="Assignments">Assignments</option>
          <option value="Study Materials">Study Materials</option>
        </select>
      </div>

      <SubjectManager />

      {selectedSubject && (
        <div className="space-y-8">
          <FileUpload onUpload={handleFileUpload} />
          {selectedChannelId && (
            <Card>
              <CardContent className="p-6">
                <FileList 
                  key={selectedChannelId} 
                  channelId={selectedChannelId} 
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 
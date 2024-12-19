"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: -1002354703805,
    Theory: -1002380915545,
    Practical: -1002428084012,
  },
  "Data Analytics with Python": {
    Main: -1002440181008,
    Theory: -1002453320466,
    Practical: -1002428199055,
  },
  "Human Computer Interface": {
    Main: -1002384952840,
    Theory: -1002445086870,
    Practical: -1002227802139,
  },
  "Mobile Application Development": {
    Main: -1002255805116,
    Theory: -1002279502965,
    Practical: -1002342357608,
  },
  "Probability Statistics": {
    Main: -1002276329421,
    Theory: -1002321230535,
    Practical: -1002493518633,
  },
  "Software Engineering": {
    Main: -1002370893044,
    Theory: -1002344359474,
    Practical: -1002424851036,
  }
} as const;

export default function NotesPage() {
  const { userId } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'Main' | 'Theory' | 'Practical'>('Main');
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedSubject || !userId) {
      toast.error("Please select a subject first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile!);
    formData.append("subject", selectedSubject);
    formData.append("uploadType", uploadType);

    console.log("Channel ID:", CHANNEL_IDS[selectedSubject][uploadType]);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      toast.error("Failed to upload file");
      return;
    }

    toast.success("File uploaded successfully to Telegram!");
  };

  const uniqueSubjects = Array.from(new Set(userSubjects));

  return (
    <div className="container py-6">
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Select Subject and Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
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

            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main">Main</SelectItem>
                <SelectItem value="Theory">Theory</SelectItem>
                <SelectItem value="Practical">Practical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center mb-4">
            <Input 
              type="file" 
              onChange={handleFileChange} 
              className="flex-1" 
              placeholder="Choose a file" 
            />
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedSubject || !selectedFile}
              className="ml-4"
            >
              <Upload className="mr-2" /> Upload
            </Button>
          </div>

          {filePreview && (
            <div className="mt-4">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold">File Preview</h3>
                  <div className="flex items-center">
                    {selectedFile?.type.startsWith("image/") ? (
                      <img src={filePreview} alt="File Preview" className="w-32 h-32 object-cover mr-4 rounded" />
                    ) : (
                      <FileText className="w-32 h-32 text-gray-500 mr-4" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{selectedFile?.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile?.size || 0) / 1024} KB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSubject && (
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Select a subject and type to view files
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
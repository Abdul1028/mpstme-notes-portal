"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FileText, Download, Search, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { upload } from '@vercel/blob/client';
import type { PutBlobResult } from '@vercel/blob';
import { UploadProgress } from "@/components/ui/upload-progress";
import type { UploadProgressEvent } from '@vercel/blob';

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: -1002392486470,
    Theory: -1002390876365,
    Practical: -1002254568649,
  },
  "Data Analytics with Python": {
    Main: -1002428431170,
    Theory: -1002355222084,
    Practical: -1002301366458,
  },
  "Human Computer Interface": {
    Main: -1002274201455,
    Theory: -1002428841710,
    Practical: -1002462133059,
  },
  "Mobile Application Development": {
    Main: -1002390629719,
    Theory: -1002313593362,
    Practical: -1002453803465,
  },
  "Probability Statistics": {
    Main: -1002277439553,
    Theory: -1002466989253,
    Practical: -1002260169268,
  },
  "Software Engineering": {
    Main: -1002342125939,
    Theory: -1002345923267,
    Practical: -1002449513822,
  }
} as const;


// Max file size
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  
  // Code files
  'text/javascript',
  'application/json',
  'text/html',
  'text/css',
  'text/xml',
];

export default function NotesPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"Main" | "Theory" | "Practical">("Main");
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<Array<{
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
    type: string;
    isFavorite: boolean;
  }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"uploading" | "processing" | "complete" | "error">("uploading");
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

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
      }
    };

    fetchUserSubjects();
  }, [userId]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedSubject) return;
      
      setIsLoadingFiles(true);
      try {
        const response = await fetch(
          `/api/files?subject=${encodeURIComponent(selectedSubject)}&type=${uploadType}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching files:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load files");
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [selectedSubject, uploadType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedSubject || !userId || !selectedFile) {
      toast.error("Please select a subject and file first");
      return;
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error(`File type ${selectedFile.type || 'unknown'} is not supported`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("uploading");

    try {
      console.log("[Client] Starting blob upload...");
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        onUploadProgress: (progress: UploadProgressEvent) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      });
      
      setUploadStatus("processing");
      setUploadProgress(70); // Indicate processing phase

      console.log("[Client] Blob upload successful:", blob.url);

      const formData = new FormData();
      formData.append("blobUrl", blob.url);
      formData.append("fileName", selectedFile.name);
      formData.append("subject", selectedSubject);
      formData.append("uploadType", uploadType);

      console.log("[Client] Sending to API...");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90); // Almost done

      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        throw new Error(
          data?.error || 
          `Upload failed with status ${response.status}`
        );
      }

      setUploadProgress(100);
      setUploadStatus("complete");
      
      console.log("[Client] Upload complete!", data);
      toast.success("File uploaded successfully!");
      setSelectedFile(null);
      setFilePreview(null);

      // Refresh files list
      if (selectedSubject) {
        const response = await fetch(
          `/api/files?subject=${encodeURIComponent(selectedSubject)}&type=${uploadType}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data);
      }

    } catch (error) {
      setUploadStatus("error");
      console.error("[Client] Upload error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus("uploading");
      }, 3000);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const uniqueSubjects = Array.from(new Set(userSubjects));

  const handleFilePreview = async (file: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
  }) => {
    if (!file.url) return;
    toast.info("Use the download button to view this file");
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (downloadingFiles.has(fileUrl)) {
      toast.info("Already downloading this file");
      return;
    }

    // Add file to downloading set
    setDownloadingFiles(prev => new Set(prev).add(fileUrl));

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Download complete!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      // Remove file from downloading set
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileUrl);
        return newSet;
      });
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${Math.round(size / (1024 * 1024))} MB`;
    } else {
      return `${Math.round(size / (1024 * 1024 * 1024))} GB`;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getFileIcon = (fileName: string) => {
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const handleFavoriteToggle = (fileId: string) => {
    setFiles(prevFiles => prevFiles.map(file => 
      file.id === fileId 
        ? { ...file, isFavorite: !file.isFavorite }
        : file
    ));
    
    toast.success('Favorite toggled');
  };

  const filterAndSortFiles = (files: Array<{
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
    type: string;
    isFavorite: boolean;
  }>) => {
    // First, filter files
    let filteredFiles = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = showFavoritesOnly ? file.isFavorite : true;
      
      if (fileTypeFilter === "all") return matchesSearch && matchesFavorite;
      
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const fileTypes: Record<string, string[]> = {
        document: ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls', 'ppt', 'pptx'],
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        video: ['mp4', 'webm', 'avi', 'mov'],
        audio: ['mp3', 'wav', 'ogg']
      };

      return matchesSearch && matchesFavorite && fileTypes[fileTypeFilter]?.includes(extension);
    });

    // Then, sort files
    return filteredFiles.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "date":
          return sortOrder === "asc"
            ? new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
            : new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "size":
          return sortOrder === "asc"
            ? a.size - b.size
            : b.size - a.size;
        default:
          return 0;
      }
    });
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto px-4">
      <Card className="mb-6 shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">Upload Study Materials</CardTitle>
          <CardDescription>
            Share your notes and materials with your classmates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select 
                onValueChange={setSelectedSubject}
                value={selectedSubject || undefined}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
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

              <Select 
                value={uploadType} 
                onValueChange={(value: "Main" | "Theory" | "Practical") => setUploadType(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleFileUpload}
                      disabled={isUploading || !selectedSubject}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <FileText className="h-5 w-5" />
              Your Uploaded Files
            </CardTitle>
            <CardDescription>
              Files you've uploaded for {selectedSubject} ({uploadType})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFiles ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <p>No files found for this subject and type</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={showFavoritesOnly ? "default" : "outline"}
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className="gap-2"
                    >
                      <Heart className="h-4 w-4" fill={showFavoritesOnly ? "currentColor" : "none"} />
                      <span className="hidden sm:inline">{showFavoritesOnly ? "All Files" : "Favorites"}</span>
                    </Button>
                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                      <SelectTrigger className="w-[100px] sm:w-[130px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="document">Docs</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
                      <SelectTrigger className="w-[100px] sm:w-[130px]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="size">Size</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="w-10"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterAndSortFiles(files).map((file) => (
                    <div 
                      key={file.id} 
                      className="group relative p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
                    >
                      {/* Download overlay */}
                      {file.url && downloadingFiles.has(file.url) && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            <span className="text-sm font-medium text-primary">Downloading...</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {/* File Icon */}
                        <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-primary"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium leading-none truncate text-foreground/90">
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => file.url && handleDownload(file.url, file.name)}
                            disabled={!file.url || downloadingFiles.has(file.url)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors"
                            title="Download file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleFavoriteToggle(file.id)}
                            className={cn(
                              "h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors",
                              file.isFavorite 
                                ? "text-primary opacity-100" 
                                : "hover:text-primary opacity-0 group-hover:opacity-100"
                            )}
                            title="Add to favorites"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={file.isFavorite ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {isUploading && selectedFile && (
          <UploadProgress
            fileName={selectedFile.name}
            progress={uploadProgress}
            status={uploadStatus}
          />
        )}
        
        {Object.entries(downloadingFiles).map(([url, { progress, status }]) => (
          <UploadProgress
            key={url}
            fileName={files.find(f => f.url === url)?.name || 'File'}
            progress={progress}
            status={status}
          />
        ))}
      </div>
    </div>
  );
}
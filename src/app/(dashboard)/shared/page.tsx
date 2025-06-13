"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FileText, Download, Search, Heart, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { upload } from '@vercel/blob/client';
import { UploadProgress } from "@/components/ui/upload-progress";
import { CHANNEL_IDS } from "@/lib/constants";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Max file size
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function SharedPage() {
  const { userId } = useAuth();
  const router = useRouter();
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
    uploadedBy: string;
    subject: string;
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
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    fetchFiles();
  }, [selectedSubject]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      console.log("Fetching files for subject:", selectedSubject);
      const url = selectedSubject 
        ? `/api/shared-files?subject=${encodeURIComponent(selectedSubject)}`
        : "/api/shared-files";
      console.log("Fetching from URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        console.error("Error response:", error);
        throw new Error(error.error || 'Failed to fetch files');
      }
      const data = await response.json();
      console.log("Received files:", data);
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load files");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleFileUpload = async () => {
    if (!userId || !selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("uploading");

    try {
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      });
      
      setUploadStatus("processing");
      setUploadProgress(70);

      const formData = new FormData();
      formData.append("blobUrl", blob.url);
      formData.append("fileName", selectedFile.name);
      formData.append("subject", selectedSubject);

      const response = await fetch("/api/shared-upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        throw new Error(
          data?.error || 
          `Upload failed with status ${response.status}`
        );
      }

      setUploadProgress(100);
      setUploadStatus("complete");
      
      toast.success("File uploaded successfully!");
      setSelectedFile(null);
      setFilePreview(null);

      // Refresh files list
      fetchFiles();

    } catch (error) {
      setUploadStatus("error");
      console.error("[Client] Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
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

  const getDownloadKey = (file: { subject: string; id: string }) => `${file.subject || ''}-${file.id}`;

  const handleDownload = async (subject: string, id: string, fileName: string) => {
    const downloadKey = `${subject || ''}-${id}`;
    if (downloadingFiles.has(downloadKey)) {
      toast.info("Already downloading this file");
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(downloadKey));

    try {
      const url = `/api/shared-download?subject=${encodeURIComponent(subject)}&id=${id}`;
      const response = await fetch(url);
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
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadKey);
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
    uploadedBy: string;
    subject: string;
  }>) => {
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
          <CardTitle className="text-xl sm:text-2xl font-bold">Shared Files</CardTitle>
          <CardDescription>
            Upload and share files with all students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CHANNEL_IDS).map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                    </span>
                  </label>
                </div>
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
                          <Upload className="mr-2 h-4 w-4" />
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <FileText className="h-5 w-5" />
            Shared Files
          </CardTitle>
          <CardDescription>
            Files shared by all students
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
                <p>No files have been shared yet</p>
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
                    key={`${file.subject || ''}-${file.id}`} 
                    className="group relative p-4 rounded-lg border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
                  >
                    {/* Downloading overlay */}
                    {downloadingFiles.has(getDownloadKey(file)) && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          <span className="text-sm font-medium text-primary">Downloading...</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>

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
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Shared by {file.uploadedBy}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleDownload(file.subject, file.id, file.name)}
                          disabled={downloadingFiles.has(getDownloadKey(file))}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
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
                          <Heart className="h-4 w-4" fill={file.isFavorite ? "currentColor" : "none"} />
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

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {isUploading && selectedFile && (
          <UploadProgress
            fileName={selectedFile.name}
            progress={uploadProgress}
            status={uploadStatus}
          />
        )}
      </div>
    </div>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FileText, Download, Search, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function NotesPage() {
  const { userId } = useAuth();
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

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("subject", selectedSubject);
      formData.append("uploadType", uploadType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      toast.success("File uploaded successfully!");
      setSelectedFile(null);
      setFilePreview(null);

      // Fetch updated files list
      const filesResponse = await fetch(
        `/api/files?subject=${encodeURIComponent(selectedSubject)}&type=${uploadType}`
      );
      if (!filesResponse.ok) {
        const error = await filesResponse.json();
        throw new Error(error.error || 'Failed to fetch files');
      }
      const updatedFiles = await filesResponse.json();
      setFiles(updatedFiles);

    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
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

  const handleFileDownload = async (file: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
  }) => {
    if (!file.url) return;

    try {
      toast.info("Downloading file...");
      
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
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
    <div className="space-y-6 p-3 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Upload files to share with your classmates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Subject and Type Selection */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedSubject || ""} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={uploadType} onValueChange={(value: "Main" | "Theory" | "Practical") => setUploadType(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
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
                    Click to upload or drag and drop
                  </span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List Section */}
      {selectedSubject && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Uploaded Files
            </CardTitle>
            <CardDescription className="text-sm">
              Files for {selectedSubject} ({uploadType})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" fill={showFavoritesOnly ? "currentColor" : "none"} />
                  <span className="hidden sm:inline">{showFavoritesOnly ? "All Files" : "Favorites"}</span>
                </Button>

                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="document">Docs</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
                  <SelectTrigger className="w-full">
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
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filterAndSortFiles(files).map((file) => (
                <Card
                  key={file.id}
                  className="hover:bg-accent/50 transition-colors group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-md bg-primary/10">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            file.isFavorite && "text-red-500"
                          )}
                          onClick={() => handleFavoriteToggle(file.id)}
                        >
                          <Heart className="h-4 w-4" fill={file.isFavorite ? "currentColor" : "none"} />
                          <span className="sr-only">
                            {file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download file</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
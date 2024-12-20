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
    <div className="container py-6 max-w-4xl mx-auto">
      <Card className="mb-6 shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Upload Study Materials</CardTitle>
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
              <div className="grid w-full gap-1.5">
                {!selectedFile ? (
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32",
                      "border-2 border-dashed border-muted-foreground/25",
                      "rounded-lg cursor-pointer",
                      "hover:bg-muted/50 transition-colors duration-200",
                      "relative overflow-hidden"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                      <svg
                        className="w-8 h-8 mb-3 text-muted-foreground"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/75">
                        Upload any File
                      </p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-lg border bg-background flex items-center justify-center">
                          {selectedFile?.type.startsWith("image/") ? (
                            <img 
                              src={filePreview || ''}
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <svg
                                className="w-8 h-8 mb-1"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                />
                              </svg>
                              <span className="text-xs">Document</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium truncate">{selectedFile?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile?.size || 0) / 1024 < 1024
                              ? `${Math.round((selectedFile?.size || 0) / 1024)} KB`
                              : `${Math.round((selectedFile?.size || 0) / 1024 / 1024)} MB`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFile?.type || "Unknown type"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={handleRemoveFile}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button 
                onClick={handleFileUpload} 
                disabled={!selectedSubject || !selectedFile || isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload File</span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                  <div className="flex gap-2">
                    <Button
                      variant={showFavoritesOnly ? "default" : "outline"}
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className="gap-2"
                    >
                      <Heart className="h-4 w-4" fill={showFavoritesOnly ? "currentColor" : "none"} />
                      {showFavoritesOnly ? "All Files" : "Favorites"}
                    </Button>
                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="File type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Sort by" />
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
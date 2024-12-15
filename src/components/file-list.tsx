"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

interface File {
  id: number;
  fileName: string;
  size: string;
  uploadDate: string;
  mimeType: string;
  message: string;
}

interface FileListProps {
  channelId: number;
}

export function FileList({ channelId }: FileListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [channelTitle, setChannelTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError("");
        console.log('Fetching files for channel:', channelId);

        const response = await fetch("/api/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getFiles",
            data: { channelId },
          }),
        });

        const data = await response.json();
        console.log('Response:', data);
        
        if (!response.ok) {
          console.error('Error response:', data);
          throw new Error(data.details || `Failed to fetch files: ${response.status} ${response.statusText}`);
        }

        if (!data.files) {
          console.error('No files array in response:', data);
          throw new Error('Invalid response format');
        }

        setFiles(data.files);
        setChannelTitle(data.channelTitle || 'Unknown Channel');
        console.log('Files loaded:', data.files.length);

        // If no files found but we have a channel title, it might be a temporary issue
        if (data.files.length === 0 && data.channelTitle) {
          console.log('No files found in channel, might be a temporary issue');
          toast.info('No files found. If you just uploaded files, please wait a moment and try again.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch files";
        console.error('Error fetching files:', err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      console.log('Starting fetch for channel:', channelId);
      fetchFiles();
    }
  }, [channelId]);

  const handleDownload = async (fileId: number) => {
    try {
      console.log('Downloading file:', fileId);
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "downloadFile",
          data: { messageId: fileId, channelId },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || "Failed to download file");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = `data:${data.mimeType};base64,${data.file}`;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File downloaded successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to download file";
      console.error("Download error:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRetry = () => {
    setError("");
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p>Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button 
          variant="outline" 
          onClick={handleRetry}
          className="mx-auto"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">{channelTitle}</h2>
        <p className="text-gray-500 mb-4">No files found in this channel</p>
        <Button 
          variant="outline" 
          onClick={handleRetry}
          className="mx-auto"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">{channelTitle}</h2>
      <Table>
        <TableCaption>List of files in {channelTitle}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No files found in this channel
              </TableCell>
            </TableRow>
          ) : (
            files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    {file.fileName}
                  </div>
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>{file.uploadDate}</TableCell>
                <TableCell>{file.mimeType}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.id)}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 
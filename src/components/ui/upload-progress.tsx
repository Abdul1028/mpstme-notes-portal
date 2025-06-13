"use client";

import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

export function UploadProgress({
  fileName,
  progress,
  status,
}: UploadProgressProps) {
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border rounded-lg shadow-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "uploading" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {status === "processing" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {status === "complete" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            status === "error" ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {status === "uploading" && "Uploading file..."}
        {status === "processing" && "Processing file..."}
        {status === "complete" && "Upload complete!"}
        {status === "error" && "Upload failed"}
      </p>
    </div>
  );
} 
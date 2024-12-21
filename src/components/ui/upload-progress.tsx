"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  progress: number;
  fileName: string;
  status: "uploading" | "processing" | "complete" | "error";
}

export function UploadProgress({ progress, fileName, status }: UploadProgressProps) {
  return (
    <div className="w-full space-y-2 bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-sm text-muted-foreground">
            {status === "uploading" && "Uploading to server..."}
            {status === "processing" && "Processing file..."}
            {status === "complete" && "Upload complete!"}
            {status === "error" && "Upload failed"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
          {status === "uploading" && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {status === "complete" && (
            <div className="text-primary">
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
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <Progress 
        value={progress} 
        className={cn(
          "transition-all",
          status === "complete" && "bg-primary/20",
          status === "error" && "bg-destructive/20"
        )}
      />
    </div>
  );
} 
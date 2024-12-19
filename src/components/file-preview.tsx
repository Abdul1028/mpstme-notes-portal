import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
  };
}

export function FilePreview({ file }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!file.url) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Preview not available</p>
      </div>
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-auto"
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load image')}
          />
          {error && (
            <div className="text-center text-destructive">{error}</div>
          )}
        </div>
      );

    case 'pdf':
      return (
        <iframe
          src={file.url}
          className="w-full h-[600px]"
          title={file.name}
        />
      );

    case 'mp4':
    case 'webm':
      return (
        <video
          controls
          className="w-full max-h-[600px]"
          onLoadStart={() => setLoading(true)}
          onLoadedData={() => setLoading(false)}
        >
          <source src={file.url} type={`video/${extension}`} />
          Your browser does not support the video tag.
        </video>
      );

    case 'mp3':
    case 'wav':
      return (
        <audio
          controls
          className="w-full mt-4"
          onLoadStart={() => setLoading(true)}
          onLoadedData={() => setLoading(false)}
        >
          <source src={file.url} type={`audio/${extension}`} />
          Your browser does not support the audio tag.
        </audio>
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <p className="text-muted-foreground">Preview not available for this file type</p>
          <Button asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download File
            </a>
          </Button>
        </div>
      );
  }
}

import { useState } from "react";
import { Loader2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    size: number;
    uploadedAt: string;
    url?: string;
    type?: 'photo' | 'document';
  };
}

export function FilePreview({ file }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (file.url) {
      try {
        // Fetch the file
        const response = await fetch(file.url);
        if (!response.ok) throw new Error('Download failed');
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a URL for the blob
        const downloadUrl = window.URL.createObjectURL(blob);
        
        // Create and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    }
  };

  if (!file.url) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Preview not available</p>
      </div>
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return (
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        <iframe
          src={file.url}
          className="w-full h-[600px]"
          title={file.name}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('Failed to load PDF');
          }}
        />
        {error && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <p className="text-muted-foreground">
        {file.type === 'photo' ? 'Download to view image' : 'Download to view file'}
      </p>
      <Button onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download File
      </Button>
    </div>
  );
}

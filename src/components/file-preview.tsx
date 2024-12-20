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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!file.url) {
      toast.error('File URL not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      toast.info("Starting download...");
      
      const response = await fetch(file.url);
      if (!response.ok) {
        const errorMessage = await response.text().catch(() => 'Download failed');
        throw new Error(errorMessage || 'Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Download completed');
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <p className="text-muted-foreground">Preview not available for this file type</p>
      <Button 
        onClick={handleDownload} 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download {file.name}
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}

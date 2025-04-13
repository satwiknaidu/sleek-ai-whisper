
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/types/chat";

interface MediaPreviewProps {
  media: MediaFile[];
  onRemove: (index: number) => void;
}

export function MediaPreview({ media, onRemove }: MediaPreviewProps) {
  if (media.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {media.map((file, index) => (
        <div key={index} className="relative rounded-md overflow-hidden border border-border w-24 h-24 bg-muted flex items-center justify-center">
          {file.type.startsWith("image/") ? (
            <img src={file.preview || file.url} alt={file.name} className="h-full w-full object-cover" />
          ) : file.type.startsWith("video/") ? (
            <video src={file.url} className="h-full w-full object-cover" />
          ) : (
            <div className="text-xs text-center p-2 truncate">{file.name}</div>
          )}
          <Button 
            size="icon" 
            variant="secondary" 
            className="absolute top-1 right-1 h-5 w-5 bg-background/80 hover:bg-background rounded-full"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

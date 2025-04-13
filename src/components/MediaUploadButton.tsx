
import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MediaFile } from "@/types/chat";

interface MediaUploadButtonProps {
  onMediaSelect: (files: MediaFile[]) => void;
  disabled?: boolean;
}

export function MediaUploadButton({ onMediaSelect, disabled = false }: MediaUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const mediaFiles: MediaFile[] = [];
    
    try {
      // Create array from FileList
      const fileArray = Array.from(files);
      
      for (const file of fileArray) {
        // Check file size
        if (file.size > 5 * 1024 * 1024) { // 5MB
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 5MB limit.`,
            variant: "destructive",
          });
          continue;
        }
        
        // For image files, create preview
        let preview = "";
        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file);
        }
        
        // Upload to Supabase
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("media-uploads")
          .upload(fileName, file);
          
        if (error) {
          console.error("Upload error:", error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}.`,
            variant: "destructive",
          });
          continue;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("media-uploads")
          .getPublicUrl(fileName);
          
        mediaFiles.push({
          url: urlData.publicUrl,
          type: file.type,
          preview,
          name: file.name
        });
      }
      
      if (mediaFiles.length > 0) {
        onMediaSelect(mediaFiles);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading files.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleUpload}
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="rounded-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach files</span>
      </Button>
    </>
  );
}

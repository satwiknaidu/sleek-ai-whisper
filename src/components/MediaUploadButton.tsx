
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
      // Check if bucket exists and create it if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'media-uploads');
      
      if (!bucketExists) {
        try {
          // Try to create the bucket via the edge function
          await supabase.functions.invoke('create-storage-bucket');
          console.log("Created media-uploads bucket");
        } catch (error) {
          console.error("Error creating bucket:", error);
          // Continue anyway as it might already exist
        }
      }
      
      // Create array from FileList
      const fileArray = Array.from(files);
      
      for (const file of fileArray) {
        // Check file size
        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB limit.`,
            variant: "destructive",
          });
          continue;
        }
        
        // For image files, create preview
        let preview = "";
        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file);
        }
        
        // First try with data URL if it's a small image file (under 500KB)
        if (file.type.startsWith("image/") && file.size < 500 * 1024) {
          try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            mediaFiles.push({
              url: dataUrl,
              type: file.type,
              preview,
              name: file.name
            });
            
            continue; // Skip Supabase upload for small images
          } catch (error) {
            console.error("Error creating data URL:", error);
            // Fall back to Supabase upload
          }
        }
        
        // Upload to Supabase
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data, error } = await supabase.storage
          .from("media-uploads")
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) {
          console.error("Upload error:", error);
          
          // Show user-friendly error
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. ${error.message}`,
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
        toast({
          title: "Upload successful",
          description: `${mediaFiles.length} file(s) uploaded successfully.`,
        });
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

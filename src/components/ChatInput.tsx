
import { useState, FormEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";
import { MediaUploadButton } from "@/components/MediaUploadButton";
import { MediaPreview } from "@/components/MediaPreview";
import { MediaFile } from "@/types/chat";

interface ChatInputProps {
  onSend: (message: string, media?: MediaFile[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || media.length > 0) && !disabled) {
      onSend(input, media);
      setInput("");
      setMedia([]);
    }
  };
  
  const handleMediaSelect = (files: MediaFile[]) => {
    setMedia(prev => [...prev, ...files]);
    // Focus back on the input field after media selection
    inputRef.current?.focus();
  };
  
  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="w-full">
      <MediaPreview media={media} onRemove={handleRemoveMedia} />
      
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 mt-2">
        <div className="flex-1 flex items-center gap-2 rounded-md border px-3 focus-within:ring-1 focus-within:ring-ring">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          
          <MediaUploadButton 
            onMediaSelect={handleMediaSelect} 
            disabled={disabled} 
          />
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          disabled={disabled || (!input.trim() && media.length === 0)}
          className="rounded-full h-10 w-10 shrink-0"
        >
          <SendHorizontal className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}

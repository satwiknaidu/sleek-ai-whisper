
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { Message as MessageType } from "@/types/chat";

interface ChatMessageProps {
  message: MessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 animate-slide-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary flex items-center justify-center text-primary-foreground">
          <Bot className="h-4 w-4" />
        </Avatar>
      )}
      
      <div
        className={cn(
          "flex flex-col gap-1 rounded-lg p-3 max-w-[80%] md:max-w-[70%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {message.mediaUrls && message.mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.mediaUrls.map((url, index) => {
              // Check media type based on URL or extension
              const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.includes('/image/');
              const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/');
              const isPdf = url.match(/\.(pdf)$/i) || url.includes('/pdf');
              
              return (
                <div key={index} className="rounded overflow-hidden max-w-xs">
                  {isImage ? (
                    <img src={url} alt="Attached content" className="max-h-40 object-contain" />
                  ) : isVideo ? (
                    <video 
                      src={url} 
                      controls 
                      className="max-h-40" 
                    />
                  ) : isPdf ? (
                    <div className="bg-background border rounded p-2 flex items-center gap-2">
                      <span className="text-sm font-medium">PDF Document</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        View
                      </a>
                    </div>
                  ) : (
                    <div className="bg-background border rounded p-2 flex items-center gap-2">
                      <span className="text-sm font-medium">Attached File</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        Download
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="text-sm break-words whitespace-pre-wrap">
          {message.content}
        </div>
        <div
          className={cn(
            "text-xs self-end",
            isUser
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          )}
        >
          {format(message.timestamp, "HH:mm")}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 bg-secondary flex items-center justify-center">
          <User className="h-4 w-4" />
        </Avatar>
      )}
    </div>
  );
}

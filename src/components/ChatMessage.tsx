
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
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

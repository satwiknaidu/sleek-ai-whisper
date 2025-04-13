
import { Avatar } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex w-full items-start gap-3 animate-fade-in">
      <Avatar className="h-8 w-8 bg-primary flex items-center justify-center text-primary-foreground">
        <Bot className="h-4 w-4" />
      </Avatar>
      
      <div className="flex gap-1 items-center bg-muted p-3 rounded-lg">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot"></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot" style={{ animationDelay: "0.2s" }}></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  );
}

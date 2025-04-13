
import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { Message } from "@/types/chat";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { MediaFile } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";

// Initialize storage bucket
const initializeStorage = async () => {
  try {
    await supabase.functions.invoke('create-storage-bucket');
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! How can I help you today? You can now send me text messages and attach images or files.",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize storage bucket when component mounts
    const setup = async () => {
      try {
        await initializeStorage();
      } catch (error) {
        console.error("Failed to initialize storage:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    setup();
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const handleSendMessage = async (content: string, media: MediaFile[] = []) => {
    // Extract media URLs
    const mediaUrls = media.map(file => file.url);
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: "user",
      timestamp: new Date(),
      mediaUrls,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Format messages for the API
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      apiMessages.push({
        role: "user",
        content
      });
      
      // Call the Gemini API via Edge Function
      const { data, error } = await supabase.functions.invoke('chat-gemini', {
        body: {
          messages: apiMessages,
          mediaUrls
        }
      });
      
      if (error) {
        console.error("Error from chat-gemini function:", error);
        throw new Error(error.message || "Failed to get a response");
      }
      
      if (!data || !data.response) {
        console.error("Invalid response structure:", data);
        throw new Error("Received an invalid response structure");
      }
      
      // Add AI message
      const aiMessage: Message = {
        id: uuidv4(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get response:", error);
      
      // Add error message to the chat
      const errorMessage: Message = {
        id: uuidv4(),
        content: "I'm sorry, I couldn't process your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get a response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full bg-background">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <ChatInput onSend={handleSendMessage} disabled={isTyping || isInitializing} />
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage, Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { v4 as uuidv4 } from "uuid";

// Mock response function
const mockResponse = async (userMessage: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const responses = [
    "I understand your question about " + userMessage.substring(0, 30) + "... Let me explain.",
    "That's an interesting point about " + userMessage.substring(0, 20) + ". Here's what I think.",
    "Thanks for asking. Based on my knowledge, I'd say that depends on several factors.",
    "Great question! The answer is not straightforward, but I'll try to explain.",
    "I've analyzed your question and here's what I can tell you about it.",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Get AI response
      const responseContent = await mockResponse(content);
      
      // Add AI message
      const aiMessage: Message = {
        id: uuidv4(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get response:", error);
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
        <ChatInput onSend={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}

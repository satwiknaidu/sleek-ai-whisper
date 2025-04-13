
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  mediaUrls?: string[];
}

export interface MediaFile {
  url: string;
  type: string;
  preview?: string;
  name: string;
}

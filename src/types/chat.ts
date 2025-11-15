// Chat-related type definitions
export interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
  sessionId?: string;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  messageCount?: number;
}

export interface ApiResponse {
  message: string;
  suggestions?: string[];
  sessionId?: string;
}

export interface ChatFeedback {
  messageId: number;
  type: 'like' | 'dislike';
  timestamp: Date;
}

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob?: Blob;
}

export type MessageStatus = 'sending' | 'sent' | 'error' | 'received';
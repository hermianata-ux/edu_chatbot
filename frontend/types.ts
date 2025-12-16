export type UserRole = 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string; // Changed from enum to string for dynamic subjects
  unit: string; // e.g., "Unit 1", "Unit 2"
  content: string; // Description or summary
  uploadedAt: string;
  views: number;
  type: 'PDF' | 'DOCX' | 'PPT' | 'TXT';
  fileData?: string; // Base64 string of the file
  fileName?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
}

export interface AnalyticsData {
  subject: string;
  views: number;
  queries: number;
}
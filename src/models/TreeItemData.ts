export type TreeItemStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Attachment {
  id: string;
  name: string;
  type: string;           // MIME type
  size: number;           // bytes
  dataUrl: string;        // base64 data URL for storage
  createdAt: string;
}

export interface YouTubeEmbed {
  id: string;
  videoId: string;        // YouTube video ID
  title?: string;         // Optional title/label
  createdAt: string;
}

export interface TreeItemData {
  description?: string;           // HTML from rich text editor
  status?: TreeItemStatus;
  attachments?: Attachment[];
  youtubeEmbeds?: YouTubeEmbed[];
  dueDate?: string;               // ISO date string, e.g. "2026-02-18"
  forToday?: boolean;
  lastModified?: string;
}

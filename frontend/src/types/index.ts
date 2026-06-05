export interface Chat {
  id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatDetail extends Chat {
  messages: Message[];
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onTitle: (title: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

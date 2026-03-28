export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Label {
  id: string;
  name: string;
  color: string; // tailwind label color key
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
  labels: string[]; // label ids
  dueDate: string | null;
  checklist: ChecklistItem[];
  memberIds: string[];
  comments: Comment[];
  archived: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  cardId: string;
  userId: string;
  action: string; // e.g. "created", "moved to In Progress", "edited description"
  timestamp: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

export type BoardBackground = {
  type: 'gradient' | 'solid';
  value: string;
};

export interface Board {
  id: string;
  title: string;
  background: BoardBackground;
  createdAt: string;
}

export interface AppState {
  boards: Board[];
  lists: List[];
  cards: Card[];
  labels: Label[];
  users: User[];
  activities: ActivityEntry[];
}

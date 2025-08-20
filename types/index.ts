export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  studyGoal: number; // minutes per day
  notifications: boolean;
  defaultView: 'grid' | 'list';
  autoSave: boolean;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'doc' | 'video' | 'audio' | 'image' | 'other';
  file?: File;
  url?: string;
  fileSize?: number;
  tags: string[];
  category: string;
  folderId?: string;
  uploadedAt: Date;
  lastAccessed?: Date;
  notes?: string;
  progress?: number; // 0-100
  isFavorite: boolean;
  color?: string;
}

export interface StudyFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  createdAt: Date;
  materialCount: number;
}

export interface StudySession {
  id: string;
  materialId?: string;
  materialTitle?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  notes?: string;
  rating?: number; // 1-5
  goals?: string[];
  completed: boolean;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  materialId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  color?: string;
  isPublic: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  repetitions: number;
  easeFactor: number;
  interval: number;
  tags: string[];
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  color: string;
  cards: Flashcard[];
  createdAt: Date;
  lastStudied?: Date;
  studyStreak: number;
}

export interface StudySchedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  materialIds: string[];
  type: 'study' | 'exam' | 'deadline' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface StudyGoal {
  id: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  unit: 'minutes' | 'materials' | 'flashcards' | 'sessions';
  deadline: Date;
  completed: boolean;
  createdAt: Date;
}

export interface StudyStats {
  totalStudyTime: number; // in minutes
  todayStudyTime: number;
  weekStudyTime: number;
  monthStudyTime: number;
  totalMaterials: number;
  totalNotes: number;
  totalFlashcards: number;
  studyStreak: number;
  averageSessionLength: number;
  favoriteSubjects: string[];
  productiveHours: number[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSave: boolean;
  defaultView: 'grid' | 'list';
  studyReminders: boolean;
  breakReminders: boolean;
  sessionDuration: number;
  breakDuration: number;
  language: 'en' | 'es' | 'fr' | 'de';
}

export interface SearchFilters {
  query: string;
  type?: StudyMaterial['type'];
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'date' | 'name' | 'size' | 'lastAccessed';
  sortOrder: 'asc' | 'desc';
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

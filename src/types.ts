export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  earnings: number;
  referralCode: string;
  referredBy?: string;
  completedLessons: string[];
  completedCourses: string[];
  completedCoursesData?: Record<string, { completedAt: any }>;
  completedTasks: string[];
  unlockedCourses: string[];
  isPremium: boolean;
  upiId?: string;
  isBanned?: boolean;
  createdAt: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  isFree: boolean;
  category: string;
  createdAt: any;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  taskDescription: string;
  order: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  date: string;
  maxCompletions?: number;
  completionCount?: number;
}

export interface EarningRecord {
  id: string;
  uid: string;
  amount: number;
  type: 'referral' | 'sale' | 'task';
  description: string;
  timestamp: any;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  amount: number;
  status: 'pending' | 'successful' | 'rejected' | 'approved';
  upiId: string;
  timestamp: any;
}

export interface TaskSubmission {
  id: string;
  uid: string;
  userDisplayName: string;
  taskId: string;
  taskTitle: string;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reward: number;
  timestamp: any;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PaymentRequest {
  id: string;
  uid: string;
  userDisplayName: string;
  courseId: string;
  amount: number;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  active: boolean;
  timestamp: any;
}

export interface ForumPost {
  id: string;
  uid: string;
  authorName: string;
  authorPhoto: string;
  title: string;
  content: string;
  category: string;
  likes: string[]; // Array of UIDs
  commentCount: number;
  timestamp: any;
}

export interface ForumComment {
  id: string;
  postId: string;
  uid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  timestamp: any;
}

export interface PlatformSettings {
  referralBonus: number;
  premiumUpgradeBonus: number;
  minWithdrawal: number;
  upiId: string;
  upiName: string;
  maintenanceMode?: boolean;
}

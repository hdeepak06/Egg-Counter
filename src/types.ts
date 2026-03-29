export interface EggLog {
  id: string;
  date: string; // ISO string
  count: number;
}

export interface UserStats {
  streak: number;
  averagePerDay: number;
  weeklyTotal: number;
  monthlyTotal: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

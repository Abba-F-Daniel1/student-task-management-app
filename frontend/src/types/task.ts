export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  userEmail: string;
}
export const TASK_STATUSES = ["to_do", "pending", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type UserName = string;

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  createdBy: UserName;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  user: UserName;
  taskId: number | null;
  taskTitle: string;
  action: "created" | "status_changed" | "updated" | "deleted";
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: string;
}

export type AuditFilterField = "all" | "name" | "status" | "date" | "description";

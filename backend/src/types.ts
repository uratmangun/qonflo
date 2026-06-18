export const TASK_STATUSES = ["to_do", "pending", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const USERS = ["john.doe", "jane.smith", "admin.user"] as const;
export type UserName = (typeof USERS)[number];

export type AuditAction = "created" | "status_changed" | "updated" | "deleted";

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
  action: AuditAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  actingUser: UserName;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  actingUser: UserName;
}

export interface AuditSearchQuery {
  q?: string;
  field?: "all" | "name" | "status" | "date" | "description";
}

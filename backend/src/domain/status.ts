import type { TaskStatus } from "../types.js";

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  to_do: ["pending"],
  pending: ["to_do", "in_progress"],
  in_progress: ["pending", "done"],
  done: [],
};

export function isValidStatus(value: string): value is TaskStatus {
  return (
    value === "to_do" ||
    value === "pending" ||
    value === "in_progress" ||
    value === "done"
  );
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: TaskStatus, to: TaskStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new DomainError(
      `Invalid status transition from "${from}" to "${to}"`,
    );
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function formatAuditTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildAuditMessage(params: {
  user: string;
  taskTitle: string;
  action: "created" | "status_changed" | "updated" | "deleted";
  fromStatus?: string | null;
  toStatus?: string | null;
  at: Date;
}): string {
  const at = formatAuditTimestamp(params.at);

  switch (params.action) {
    case "created":
      return `User "${params.user}" created Task "${params.taskTitle}" with status "${params.toStatus}" at ${at}`;
    case "status_changed":
      return `User "${params.user}" changed Task "${params.taskTitle}" status from "${params.fromStatus}" to "${params.toStatus}" at ${at}`;
    case "deleted":
      return `User "${params.user}" deleted Task "${params.taskTitle}" at ${at}`;
    case "updated":
      return `User "${params.user}" updated Task "${params.taskTitle}" at ${at}`;
  }
}

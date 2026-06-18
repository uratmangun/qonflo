import type { TaskStatus } from "../types";

const LABELS: Record<TaskStatus, string> = {
  to_do: "to_do",
  pending: "pending",
  in_progress: "in_progress",
  done: "done",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status-badge ${status}`}>{LABELS[status]}</span>;
}

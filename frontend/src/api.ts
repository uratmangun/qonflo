import type { AuditFilterField, AuditLogEntry, Task, TaskStatus } from "./types";

const API_BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchUsers(): Promise<{ users: string[] }> {
  return request("/tasks/users");
}

export function fetchTasks(): Promise<{ tasks: Task[] }> {
  return request("/tasks");
}

export function createTask(input: {
  title: string;
  description: string;
  status: TaskStatus;
  actingUser: string;
}): Promise<{ task: Task }> {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(
  id: number,
  input: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    actingUser: string;
  },
): Promise<{ task: Task }> {
  return request(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: number, actingUser: string): Promise<void> {
  return request(`/tasks/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actingUser }),
  });
}

export function fetchAuditLogs(params?: {
  q?: string;
  field?: AuditFilterField;
}): Promise<{ logs: AuditLogEntry[] }> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.field) search.set("field", params.field);
  const query = search.toString();
  return request(`/audit-logs${query ? `?${query}` : ""}`);
}

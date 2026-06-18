import Database from "better-sqlite3";
import type { AuditLogEntry, Task, TaskStatus, UserName } from "./types.js";

export type AppDatabase = Database.Database;

export function createDatabase(path: string = ":memory:"): AppDatabase {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('to_do', 'pending', 'in_progress', 'done')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      task_id INTEGER,
      task_title TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('created', 'status_changed', 'updated', 'deleted')),
      from_status TEXT,
      to_status TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  return db;
}

export function withTransaction<T>(db: AppDatabase, fn: () => T): T {
  return db.transaction(fn)();
}

export function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    status: row.status as TaskStatus,
    createdBy: row.created_by as UserName,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToAuditLog(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as number,
    user: row.user as UserName,
    taskId: (row.task_id as number | null) ?? null,
    taskTitle: row.task_title as string,
    action: row.action as AuditLogEntry["action"],
    fromStatus: (row.from_status as TaskStatus | null) ?? null,
    toStatus: (row.to_status as TaskStatus | null) ?? null,
    message: row.message as string,
    createdAt: row.created_at as string,
  };
}

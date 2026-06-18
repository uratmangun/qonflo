import type { AppDatabase } from "../db.js";
import {
  AuthorizationError,
  DomainError,
  assertValidTransition,
  buildAuditMessage,
  isValidStatus,
} from "../domain/status.js";
import { rowToAuditLog, rowToTask, withTransaction } from "../db.js";
import type {
  AuditLogEntry,
  AuditSearchQuery,
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
  UserName,
} from "../types.js";
import { USERS } from "../types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function assertUser(user: string): asserts user is UserName {
  if (!USERS.includes(user as UserName)) {
    throw new DomainError(`Unknown user "${user}"`);
  }
}

function assertCreator(task: Task, actingUser: UserName): void {
  if (task.createdBy !== actingUser) {
    throw new AuthorizationError(
      `Only the creator (${task.createdBy}) can modify this task`,
    );
  }
}

function insertAuditLog(
  db: AppDatabase,
  entry: {
    user: UserName;
    taskId: number | null;
    taskTitle: string;
    action: AuditLogEntry["action"];
    fromStatus?: TaskStatus | null;
    toStatus?: TaskStatus | null;
    message: string;
    createdAt: string;
  },
): AuditLogEntry {
  const result = db
    .prepare(
      `INSERT INTO audit_logs (user, task_id, task_title, action, from_status, to_status, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.user,
      entry.taskId,
      entry.taskTitle,
      entry.action,
      entry.fromStatus ?? null,
      entry.toStatus ?? null,
      entry.message,
      entry.createdAt,
    );

  const row = db
    .prepare("SELECT * FROM audit_logs WHERE id = ?")
    .get(result.lastInsertRowid);

  return rowToAuditLog(row as Record<string, unknown>);
}

export class TaskService {
  constructor(private readonly db: AppDatabase) {}

  listTasks(): Task[] {
    const rows = this.db
      .prepare("SELECT * FROM tasks ORDER BY id DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToTask);
  }

  getTask(id: number): Task | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return row ? rowToTask(row as Record<string, unknown>) : null;
  }

  createTask(input: CreateTaskInput): Task {
    assertUser(input.actingUser);

    const title = input.title.trim();
    if (!title) throw new DomainError("Task title is required");

    if (!isValidStatus(input.status)) {
      throw new DomainError(`Invalid status "${input.status}"`);
    }

    const timestamp = nowIso();

    return withTransaction(this.db, () => {
      const result = this.db
        .prepare(
          `INSERT INTO tasks (title, description, status, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          title,
          input.description.trim(),
          input.status,
          input.actingUser,
          timestamp,
          timestamp,
        );

      const task = this.getTask(Number(result.lastInsertRowid));
      if (!task) throw new Error("Failed to create task");

      insertAuditLog(this.db, {
        user: input.actingUser,
        taskId: task.id,
        taskTitle: task.title,
        action: "created",
        toStatus: task.status,
        message: buildAuditMessage({
          user: input.actingUser,
          taskTitle: task.title,
          action: "created",
          toStatus: task.status,
          at: new Date(timestamp),
        }),
        createdAt: timestamp,
      });

      return task;
    });
  }

  updateTask(id: number, input: UpdateTaskInput): Task {
    assertUser(input.actingUser);

    const existing = this.getTask(id);
    if (!existing) throw new DomainError(`Task ${id} not found`);

    assertCreator(existing, input.actingUser);

    const nextTitle =
      input.title !== undefined ? input.title.trim() : existing.title;
    const nextDescription =
      input.description !== undefined
        ? input.description.trim()
        : existing.description;
    const nextStatus = input.status ?? existing.status;

    if (!nextTitle) throw new DomainError("Task title is required");
    if (!isValidStatus(nextStatus)) {
      throw new DomainError(`Invalid status "${nextStatus}"`);
    }

    assertValidTransition(existing.status, nextStatus);

    const statusChanged = nextStatus !== existing.status;
    const metadataChanged =
      nextTitle !== existing.title || nextDescription !== existing.description;

    if (!statusChanged && !metadataChanged) {
      return existing;
    }

    const timestamp = nowIso();

    return withTransaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE tasks
           SET title = ?, description = ?, status = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(nextTitle, nextDescription, nextStatus, timestamp, id);

      const updated = this.getTask(id);
      if (!updated) throw new Error("Failed to update task");

      if (statusChanged) {
        insertAuditLog(this.db, {
          user: input.actingUser,
          taskId: updated.id,
          taskTitle: updated.title,
          action: "status_changed",
          fromStatus: existing.status,
          toStatus: updated.status,
          message: buildAuditMessage({
            user: input.actingUser,
            taskTitle: updated.title,
            action: "status_changed",
            fromStatus: existing.status,
            toStatus: updated.status,
            at: new Date(timestamp),
          }),
          createdAt: timestamp,
        });
      } else if (metadataChanged) {
        insertAuditLog(this.db, {
          user: input.actingUser,
          taskId: updated.id,
          taskTitle: updated.title,
          action: "updated",
          message: buildAuditMessage({
            user: input.actingUser,
            taskTitle: updated.title,
            action: "updated",
            at: new Date(timestamp),
          }),
          createdAt: timestamp,
        });
      }

      return updated;
    });
  }

  deleteTask(id: number, actingUser: UserName): void {
    assertUser(actingUser);

    const existing = this.getTask(id);
    if (!existing) throw new DomainError(`Task ${id} not found`);

    assertCreator(existing, actingUser);

    const timestamp = nowIso();

    withTransaction(this.db, () => {
      insertAuditLog(this.db, {
        user: actingUser,
        taskId: null,
        taskTitle: existing.title,
        action: "deleted",
        fromStatus: existing.status,
        message: buildAuditMessage({
          user: actingUser,
          taskTitle: existing.title,
          action: "deleted",
          at: new Date(timestamp),
        }),
        createdAt: timestamp,
      });

      this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    });
  }

  listAuditLogs(query: AuditSearchQuery = {}): AuditLogEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM audit_logs ORDER BY id DESC")
      .all() as Record<string, unknown>[];

    const logs = rows.map(rowToAuditLog);
    const term = query.q?.trim().toLowerCase();
    if (!term) return logs;

    const field = query.field ?? "all";

    return logs.filter((log) => {
      const haystacks: string[] = [];

      if (field === "all" || field === "name") {
        haystacks.push(log.taskTitle.toLowerCase(), log.user.toLowerCase());
      }
      if (field === "all" || field === "status") {
        haystacks.push(
          log.fromStatus?.toLowerCase() ?? "",
          log.toStatus?.toLowerCase() ?? "",
          log.message.toLowerCase(),
        );
      }
      if (field === "all" || field === "date") {
        haystacks.push(log.createdAt.toLowerCase(), log.message.toLowerCase());
      }
      if (field === "all" || field === "description") {
        haystacks.push(log.message.toLowerCase());
      }

      return haystacks.some((value) => value.includes(term));
    });
  }
}

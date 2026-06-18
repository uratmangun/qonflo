import { describe, expect, it } from "vitest";
import { createDatabase } from "../src/db.js";
import { TaskService } from "../src/services/taskService.js";
import {
  AuthorizationError,
  DomainError,
} from "../src/domain/status.js";

function createService() {
  const db = createDatabase(":memory:");
  return { db, service: new TaskService(db) };
}

describe("TaskService", () => {
  it("creates a task and audit log entry", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "to_do",
      actingUser: "john.doe",
    });

    expect(task.createdBy).toBe("john.doe");
    expect(task.status).toBe("to_do");

    const logs = service.listAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("created");
    expect(logs[0].message).toContain('User "john.doe" created Task "Prepare Invoice"');
  });

  it("does not create audit log when status is unchanged (idempotent update)", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    const updated = service.updateTask(task.id, {
      status: "pending",
      actingUser: "john.doe",
    });

    expect(updated.status).toBe("pending");

    const logs = service.listAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("created");
  });

  it("creates status_changed audit log only when status actually changes", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    service.updateTask(task.id, {
      status: "in_progress",
      actingUser: "john.doe",
    });

    const logs = service.listAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe("status_changed");
    expect(logs[0].message).toContain('from "pending" to "in_progress"');
  });

  it("rejects invalid status transitions", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "to_do",
      actingUser: "john.doe",
    });

    expect(() =>
      service.updateTask(task.id, {
        status: "done",
        actingUser: "john.doe",
      }),
    ).toThrow(DomainError);

    const persisted = service.getTask(task.id);
    expect(persisted?.status).toBe("to_do");

    const logs = service.listAuditLogs();
    expect(logs).toHaveLength(1);
  });

  it("only allows the creator to update a task", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    expect(() =>
      service.updateTask(task.id, {
        status: "in_progress",
        actingUser: "jane.smith",
      }),
    ).toThrow(AuthorizationError);

    const persisted = service.getTask(task.id);
    expect(persisted?.status).toBe("pending");
  });

  it("only allows the creator to delete a task", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    expect(() => service.deleteTask(task.id, "jane.smith")).toThrow(
      AuthorizationError,
    );

    expect(service.getTask(task.id)).not.toBeNull();
  });

  it("logs deletion and removes task while keeping audit history", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    service.deleteTask(task.id, "john.doe");

    expect(service.getTask(task.id)).toBeNull();

    const logs = service.listAuditLogs();
    expect(logs.some((log) => log.action === "deleted")).toBe(true);
    expect(logs.some((log) => log.action === "created")).toBe(true);
  });

  it("keeps task status and audit log in sync after valid update", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Review Contract",
      description: "Legal review",
      status: "pending",
      actingUser: "jane.smith",
    });

    service.updateTask(task.id, {
      status: "in_progress",
      actingUser: "jane.smith",
    });

    const persisted = service.getTask(task.id);
    const latestStatusLog = service
      .listAuditLogs()
      .find((log) => log.action === "status_changed");

    expect(persisted?.status).toBe("in_progress");
    expect(latestStatusLog?.toStatus).toBe("in_progress");
    expect(latestStatusLog?.fromStatus).toBe("pending");
  });

  it("filters audit logs by search query", () => {
    const { service } = createService();

    const task = service.createTask({
      title: "Prepare Invoice",
      description: "Monthly invoice",
      status: "pending",
      actingUser: "john.doe",
    });

    service.updateTask(task.id, {
      status: "in_progress",
      actingUser: "john.doe",
    });

    const byName = service.listAuditLogs({ q: "prepare", field: "name" });
    expect(byName.length).toBeGreaterThan(0);

    const byStatus = service.listAuditLogs({ q: "in_progress", field: "status" });
    expect(byStatus.length).toBeGreaterThan(0);
  });
});

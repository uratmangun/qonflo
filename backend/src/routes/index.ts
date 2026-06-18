import { Router } from "express";
import {
  AuthorizationError,
  DomainError,
} from "../domain/status.js";
import type { TaskService } from "../services/taskService.js";
import type { TaskStatus } from "../types.js";
import { USERS } from "../types.js";

function handleError(error: unknown, res: import("express").Response): void {
  if (error instanceof DomainError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

export function createTaskRouter(service: TaskService): Router {
  const router = Router();

  router.get("/users", (_req, res) => {
    res.json({ users: USERS });
  });

  router.get("/", (_req, res) => {
    res.json({ tasks: service.listTasks() });
  });

  router.post("/", (req, res) => {
    try {
      const { title, description, status, actingUser } = req.body as {
        title?: string;
        description?: string;
        status?: TaskStatus;
        actingUser?: string;
      };

      const task = service.createTask({
        title: title ?? "",
        description: description ?? "",
        status: status ?? "to_do",
        actingUser: actingUser as (typeof USERS)[number],
      });

      res.status(201).json({ task });
    } catch (error) {
      handleError(error, res);
    }
  });

  router.patch("/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { title, description, status, actingUser } = req.body as {
        title?: string;
        description?: string;
        status?: TaskStatus;
        actingUser?: string;
      };

      const task = service.updateTask(id, {
        title,
        description,
        status,
        actingUser: actingUser as (typeof USERS)[number],
      });

      res.json({ task });
    } catch (error) {
      handleError(error, res);
    }
  });

  router.delete("/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const actingUser = (req.body as { actingUser?: string }).actingUser;

      service.deleteTask(id, actingUser as (typeof USERS)[number]);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
}

export function createAuditRouter(service: TaskService): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const field = typeof req.query.field === "string" ? req.query.field : "all";

    const logs = service.listAuditLogs({
      q,
      field: field as "all" | "name" | "status" | "date" | "description",
    });

    res.json({ logs });
  });

  return router;
}

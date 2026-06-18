import cors from "cors";
import express, { type Express } from "express";
import { createDatabase, type AppDatabase } from "./db.js";
import { createAuditRouter, createTaskRouter } from "./routes/index.js";
import { TaskService } from "./services/taskService.js";

const PORT = Number(process.env.PORT ?? 3001);
const DB_PATH = process.env.DB_PATH ?? "taskflow.sqlite";

const db: AppDatabase = createDatabase(DB_PATH);
const service = new TaskService(db);

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/tasks", createTaskRouter(service));
app.use("/api/audit-logs", createAuditRouter(service));

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
  });
}

export { app, db, service };

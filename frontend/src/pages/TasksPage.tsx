import { useEffect, useState } from "react";
import { CirclePlus } from "lucide-react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { Task, TaskStatus } from "../types";
import { TASK_STATUSES } from "../types";

interface TasksPageProps {
  actingUser: string;
  onDataChange: () => void;
}

interface EditState {
  task: Task;
  title: string;
  description: string;
  status: TaskStatus;
}

export function TasksPage({ actingUser, onDataChange }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("to_do");
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  async function loadTasks() {
    const response = await fetchTasks();
    setTasks(response.tasks);
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await createTask({ title, description, status, actingUser });
      setTitle("");
      setDescription("");
      setStatus("to_do");
      await loadTasks();
      onDataChange();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create task");
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setError(null);

    try {
      await deleteTask(task.id, actingUser);
      await loadTasks();
      onDataChange();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete task");
    }
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setError(null);

    try {
      await updateTask(editState.task.id, {
        title: editState.title,
        description: editState.description,
        status: editState.status,
        actingUser,
      });
      setEditState(null);
      await loadTasks();
      onDataChange();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update task");
    }
  }

  return (
    <main className="main-content">
      <header className="page-header">
        <h2>Tasks</h2>
        <p>Create, update, and manage tasks. Actions are logged to the audit trail.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="card">
        <h3 className="card-title">
          <CirclePlus size={20} color="var(--accent-primary)" />
          Create New Task
        </h3>
        <form className="form-grid" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="title">Task Title</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the task..."
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Create Task
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="section-header">
          <h3>All Tasks</h3>
          <span>{tasks.length} tasks</span>
        </div>

        <div className="table">
          <div className="table-head">
            <div>Task</div>
            <div>Description</div>
            <div>Status</div>
            <div>Created By</div>
            <div>Actions</div>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">No tasks yet. Create one above.</div>
          ) : (
            tasks.map((task) => (
              <div className="table-row" key={task.id}>
                <div>{task.title}</div>
                <div className="description">{task.description || "—"}</div>
                <div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="creator">{task.createdBy}</div>
                <div className="row-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      setEditState({
                        task,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => void handleDelete(task)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {editState ? (
        <div className="modal-backdrop" onClick={() => setEditState(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button type="button" onClick={() => setEditState(null)}>
                ×
              </button>
            </div>

            <div className="field">
              <label htmlFor="edit-title">Task Title</label>
              <input
                id="edit-title"
                value={editState.title}
                onChange={(event) =>
                  setEditState({ ...editState, title: event.target.value })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={editState.description}
                onChange={(event) =>
                  setEditState({ ...editState, description: event.target.value })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                value={editState.status}
                onChange={(event) =>
                  setEditState({
                    ...editState,
                    status: event.target.value as TaskStatus,
                  })
                }
              >
                {TASK_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setEditState(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void handleSaveEdit()}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

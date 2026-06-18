import { useEffect, useState } from "react";
import { ArrowRightLeft, Lock, Plus, Search, Trash2 } from "lucide-react";
import { fetchAuditLogs } from "../api";
import type { AuditFilterField, AuditLogEntry } from "../types";

const FILTER_OPTIONS: { value: AuditFilterField; label: string }[] = [
  { value: "all", label: "All fields" },
  { value: "name", label: "Task name" },
  { value: "status", label: "Status" },
  { value: "date", label: "Date" },
  { value: "description", label: "Description" },
];

function LogIcon({ entry }: { entry: AuditLogEntry }) {
  if (entry.action === "deleted") return <Trash2 size={16} />;
  if (entry.action === "created") return <Plus size={16} />;
  if (entry.action === "status_changed") return <ArrowRightLeft size={16} />;
  return <ArrowRightLeft size={16} />;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [field, setField] = useState<AuditFilterField>("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchAuditLogs({ q: query || undefined, field }).then((response) => {
        setLogs(response.logs);
      });
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [query, field]);

  return (
    <main className="main-content">
      <header className="page-header">
        <h2>Audit Log</h2>
        <p>Immutable record of all task changes. Entries cannot be deleted.</p>
      </header>

      <div className="notice">
        <Lock size={18} />
        Audit log entries are permanent and cannot be removed by any user.
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={18} color="var(--text-secondary)" />
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search audit log..."
          />
        </div>
        <select
          className="filter-select"
          value={field}
          onChange={(event) => setField(event.target.value as AuditFilterField)}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <section className="log-list">
        <div className="log-header">
          <span>ACTIVITY LOG</span>
          <span>{logs.length} entries</span>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">No audit log entries match your search.</div>
        ) : (
          logs.map((entry) => (
            <div className={`log-entry ${entry.action}`} key={entry.id}>
              <LogIcon entry={entry} />
              <div>{entry.message}</div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

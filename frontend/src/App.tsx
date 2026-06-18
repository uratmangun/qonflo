import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { fetchUsers } from "./api";
import { Sidebar } from "./components/Sidebar";
import { AuditLogPage } from "./pages/AuditLogPage";
import { TasksPage } from "./pages/TasksPage";

export default function App() {
  const [users, setUsers] = useState<string[]>([]);
  const [actingUser, setActingUser] = useState("john.doe");
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  useEffect(() => {
    void fetchUsers().then((response) => {
      setUsers(response.users);
      if (response.users.length > 0) {
        setActingUser(response.users[0]);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar
          actingUser={actingUser}
          users={users}
          onUserChange={setActingUser}
        />
        <Routes>
          <Route
            path="/"
            element={
              <TasksPage
                actingUser={actingUser}
                onDataChange={() => setAuditRefreshKey((value) => value + 1)}
              />
            }
          />
          <Route path="/audit-log" element={<AuditLogPage key={auditRefreshKey} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

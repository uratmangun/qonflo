import { ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  actingUser: string;
  users: string[];
  onUserChange: (user: string) => void;
}

export function Sidebar({ actingUser, users, onUserChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo-row">
        <ClipboardList size={24} />
        <h1>TaskFlow</h1>
      </div>

      <div>
        <div className="nav-label">NAVIGATION</div>
        <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end>
          Tasks
        </NavLink>
        <NavLink
          to="/audit-log"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Audit Log
        </NavLink>
      </div>

      <div className="user-section">
        <div className="user-label">ACTING AS</div>
        <select
          className="user-select"
          value={actingUser}
          onChange={(event) => onUserChange(event.target.value)}
        >
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

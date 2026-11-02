"use client";

import { useState } from "react";
import { Users, Search } from "lucide-react";
import type { User } from "@/lib/types";
import { platformRoleLabel } from "../platform-format";

export function AccountDirectory({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section
      className="panel subscription-directory"
      aria-label="Account directory"
    >
      <div className="section-heading">
        <div>
          <h2>Central Account Directory</h2>
          <p>
            All registered platform administrators and business users across
            salons.
          </p>
        </div>
        <span className="small-caps">
          {filtered.length} OF {users.length} ACCOUNTS
        </span>
      </div>

      <div className="directory-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            className="input search-input"
            placeholder="Search accounts by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length ? (
        <div className="table-scroll">
          <table className="platform-responsive-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Email Address</th>
                <th>Account Type</th>
                <th>Platform Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td data-label="User Identity">
                    <strong>{user.name}</strong>
                  </td>
                  <td data-label="Email Address">{user.email}</td>
                  <td data-label="Account Type">
                    <span
                      className={`status ${user.is_platform_admin ? "booked" : "completed"}`}
                    >
                      {user.is_platform_admin
                        ? "Platform Admin"
                        : "Business User"}
                    </span>
                  </td>
                  <td data-label="Platform Role">
                    {user.is_platform_admin ? (
                      <span className="role-tag">
                        {platformRoleLabel(user.platform_role)}
                      </span>
                    ) : (
                      <span className="cell-sub">Standard Member</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Users size={28} />
          <h3>No accounts match your search</h3>
          <p>Try searching with another name or email keyword.</p>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAllUsers, updateUserRole, type UserWithId } from "@/lib/db/admin";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const allUsers = await getAllUsers();
        // Sort by XP desc
        allUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggleRole(userId: string, currentRole: string) {
    if (userId === currentUser?.uid) {
      alert("You cannot change your own role.");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;

    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.university?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Users
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {users.length} registered users
        </p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username, email, or university..."
        className="w-full max-w-md px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm subtle-border focus:outline-none focus:ring-1 focus:ring-primary-brand"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-outline text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low subtle-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">University</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">XP</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                        <span className="text-xs text-primary-brand font-medium">
                          {u.username?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="text-on-surface text-sm font-medium">{u.username || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-sm">{u.university || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-primary-brand text-sm">{u.xp || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === "admin"
                        ? "bg-purple-500/15 text-purple-400"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role || "user")}
                      disabled={u.id === currentUser?.uid || updatingId === u.id}
                      className="text-xs text-primary-brand hover:underline disabled:opacity-30 disabled:no-underline"
                    >
                      {updatingId === u.id
                        ? "Updating..."
                        : u.role === "admin"
                        ? "Demote"
                        : "Promote"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { PanelUser, Role } from "@/types";
import { UserCog, Plus, Trash2, Edit, X, Check } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("VIEWER");

  // Edit form state
  const [editRole, setEditRole] = useState<Role>("VIEWER");
  const [editPassword, setEditPassword] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch<PanelUser[]>("/users");
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async () => {
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });
      setSuccess(`User ${newUsername} created`);
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("VIEWER");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const updateUser = async (id: number) => {
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, string> = { role: editRole };
      if (editPassword.trim()) body.password = editPassword;

      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSuccess("User updated");
      setEditingId(null);
      setEditPassword("");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const deleteUser = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      setSuccess(`User ${username} deleted`);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-500/20 text-red-400",
    MOD: "bg-yellow-500/20 text-yellow-400",
    VIEWER: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3 bg-green-950/50 border border-green-900 rounded-lg text-sm text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Create user form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Create User</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="VIEWER">VIEWER</option>
                <option value="MOD">MOD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              onClick={createUser}
              disabled={!newUsername || !newPassword}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 hover:bg-secondary/50 transition"
                >
                  <td className="px-6 py-3 font-medium text-foreground">{user.username}</td>
                  <td className="px-6 py-3">
                    {editingId === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as Role)}
                        className="px-2 py-1 bg-secondary border border-border rounded text-foreground text-xs"
                      >
                        <option value="VIEWER">VIEWER</option>
                        <option value="MOD">MOD</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          roleColors[user.role] || "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {editingId === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="New password (optional)"
                          className="px-2 py-1 bg-secondary border border-border rounded text-foreground text-xs w-40"
                        />
                        <button
                          onClick={() => updateUser(user.id)}
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-950/30 transition"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditPassword("");
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setEditRole(user.role);
                            setEditPassword("");
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

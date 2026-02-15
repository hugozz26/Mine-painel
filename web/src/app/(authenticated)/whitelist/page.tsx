"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { WhitelistEntry } from "@/types";
import { List, Plus, Trash2 } from "lucide-react";

export default function WhitelistPage() {
  const { hasRole } = useAuth();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWhitelist = useCallback(async () => {
    try {
      const data = await apiFetch<WhitelistEntry[]>("/mc/whitelist");
      setEntries(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const addPlayer = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch("/mc/whitelist/add", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setSuccess(`${newName} added to whitelist`);
      setNewName("");
      fetchWhitelist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const removePlayer = async (name: string) => {
    if (!confirm(`Remove ${name} from the whitelist?`)) return;
    setError(null);
    setSuccess(null);

    try {
      await apiFetch("/mc/whitelist/remove", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setSuccess(`${name} removed from whitelist`);
      fetchWhitelist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <List className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Whitelist</h1>
        <span className="text-sm text-muted-foreground">({entries.length} players)</span>
      </div>

      {/* Add player form (MOD/ADMIN) */}
      {hasRole("MOD") && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3">Add Player</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="PlayerName"
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            />
            <button
              onClick={addPlayer}
              disabled={adding || !newName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {success && (
            <p className="mt-2 text-sm text-green-400">{success}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>
      )}

      {/* Whitelist table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading whitelist...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Whitelist is empty</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="px-6 py-3 font-medium">Player</th>
                <th className="px-6 py-3 font-medium">UUID</th>
                {hasRole("MOD") && (
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.uuid} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="px-6 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://mc-heads.net/avatar/${entry.uuid}/24`}
                        alt={entry.name}
                        className="w-6 h-6 rounded"
                        width={24}
                        height={24}
                      />
                      {entry.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground font-mono text-xs">
                    {entry.uuid}
                  </td>
                  {hasRole("MOD") && (
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removePlayer(entry.name)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition"
                        title="Remove from whitelist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

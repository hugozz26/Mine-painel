"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { AuditLogEntry, PaginatedResponse } from "@/types";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<AuditLogEntry>>(
        `/audit?page=${page}&limit=30`
      );
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionColors: Record<string, string> = {
    LOGIN: "bg-green-500/20 text-green-400",
    COMMAND_EXEC: "bg-yellow-500/20 text-yellow-400",
    COMMAND_DENIED: "bg-red-500/20 text-red-400",
    WHITELIST_ADD: "bg-blue-500/20 text-blue-400",
    WHITELIST_REMOVE: "bg-orange-500/20 text-orange-400",
    VIEW_INVENTORY: "bg-purple-500/20 text-purple-400",
    VIEW_ENDERCHEST: "bg-purple-500/20 text-purple-400",
    CREATE_USER: "bg-green-500/20 text-green-400",
    DELETE_USER: "bg-red-500/20 text-red-400",
    UPDATE_USER: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No audit logs</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-secondary/50 transition"
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {log.actorUsername}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={log.actorRole} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          actionColors[log.action] || "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {log.target || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {log.ip}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {log.detailsJson || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-red-500/20 text-red-400",
    MOD: "bg-yellow-500/20 text-yellow-400",
    VIEWER: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
        colors[role] || "bg-gray-500/20 text-gray-400"
      }`}
    >
      {role}
    </span>
  );
}

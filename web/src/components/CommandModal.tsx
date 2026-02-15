"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  type: string; // "say" | "kick" | "tempban"
  playerName: string;
  onClose: () => void;
}

/**
 * Confirmation modal for executing commands on a player.
 */
export default function CommandModal({ type, playerName, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let command = type;
      let args: string[] = [];

      switch (type) {
        case "say":
          args = [message];
          break;
        case "kick":
          command = "kick";
          args = [playerName, reason || "Kicked by panel"];
          break;
        case "tempban":
          command = "tempban";
          args = [playerName, duration || "1h", reason || "Banned by panel"];
          break;
      }

      const data = await apiFetch<{ ok: boolean; message: string }>("/mc/command", {
        method: "POST",
        body: JSON.stringify({ command, args }),
      });

      setResult(data.message || "Command executed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command failed");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<string, string> = {
    say: "Send Server Message",
    kick: `Kick ${playerName}`,
    tempban: `Tempban ${playerName}`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-foreground">{titles[type] || type}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {type === "say" && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Message</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Hello everyone!"
                autoFocus
              />
            </div>
          )}

          {(type === "kick" || type === "tempban") && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Rule violation"
                autoFocus
              />
            </div>
          )}

          {type === "tempban" && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1h, 1d, 7d..."
              />
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-950/50 border border-green-900 rounded-lg text-sm text-green-400">
              {result}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={execute}
            disabled={loading || (type === "say" && !message)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Executing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}

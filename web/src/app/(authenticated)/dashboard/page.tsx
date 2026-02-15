"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ServerHealth, PlayerSummary } from "@/types";
import {
  Activity,
  Users,
  Server,
  Wifi,
  WifiOff,
  Gauge,
  Heart,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [h, p] = await Promise.all([
        apiFetch<ServerHealth>("/mc/health"),
        apiFetch<PlayerSummary[]>("/mc/players"),
      ]);
      setHealth(h);
      setPlayers(p);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch server data");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const isOnline = health?.ok === true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <Wifi className="w-4 h-4" />
              Server Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <WifiOff className="w-4 h-4" />
              {error || "Server Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Online Players"
          value={health ? `${health.onlinePlayers} / ${health.maxPlayers}` : "—"}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={<Server className="w-5 h-5" />}
          label="Server Version"
          value={health?.version?.split("-")[0] || "—"}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={<Gauge className="w-5 h-5" />}
          label="TPS"
          value={health?.tps !== undefined ? String(health.tps) : "—"}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Status"
          value={isOnline ? "Online" : "Offline"}
          color={isOnline ? "text-green-400" : "text-red-400"}
          bgColor={isOnline ? "bg-green-500/10" : "bg-red-500/10"}
        />
      </div>

      {/* Online players list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Online Players</h2>
          <span className="text-sm text-muted-foreground">{players.length} online</span>
        </div>

        {players.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No players online
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="px-6 py-3 font-medium">Player</th>
                  <th className="px-6 py-3 font-medium">World</th>
                  <th className="px-6 py-3 font-medium">Position</th>
                  <th className="px-6 py-3 font-medium">Gamemode</th>
                  <th className="px-6 py-3 font-medium">Health</th>
                  <th className="px-6 py-3 font-medium">Ping</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr
                    key={player.uuid}
                    className="border-b border-border/50 hover:bg-secondary/50 transition"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/players/${player.uuid}`}
                        className="flex items-center gap-2 text-primary hover:underline font-medium"
                      >
                        <img
                          src={`https://mc-heads.net/avatar/${player.uuid}/24`}
                          alt={player.name}
                          className="w-6 h-6 rounded"
                          width={24}
                          height={24}
                        />
                        {player.name}
                        {player.isOp && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 rounded">
                            OP
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{player.world}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs font-mono">
                      {player.x.toFixed(0)}, {player.y.toFixed(0)}, {player.z.toFixed(0)}
                    </td>
                    <td className="px-6 py-3">
                      <GamemodeBadge mode={player.gamemode} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-1 text-red-400">
                        <Heart className="w-3.5 h-3.5" />
                        {player.health.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{player.ping}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function GamemodeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    SURVIVAL: "bg-green-500/20 text-green-400",
    CREATIVE: "bg-yellow-500/20 text-yellow-400",
    ADVENTURE: "bg-blue-500/20 text-blue-400",
    SPECTATOR: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        colors[mode] || "bg-gray-500/20 text-gray-400"
      }`}
    >
      {mode}
    </span>
  );
}

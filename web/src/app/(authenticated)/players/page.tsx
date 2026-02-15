"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { PlayerSummary } from "@/types";
import Link from "next/link";
import { Search, Heart, Users } from "lucide-react";

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await apiFetch<PlayerSummary[]>("/mc/players");
      setPlayers(data);
    } catch {
      // silently fail — dashboard shows status
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 15000);
    return () => clearInterval(interval);
  }, [fetchPlayers]);

  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.uuid.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Players</h1>
        </div>
        <span className="text-sm text-muted-foreground">{players.length} online</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or UUID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Player cards */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {search ? "No players match your search" : "No players online"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player) => (
            <Link
              key={player.uuid}
              href={`/players/${player.uuid}`}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={`https://mc-heads.net/avatar/${player.uuid}/48`}
                  alt={player.name}
                  className="w-12 h-12 rounded-lg"
                  width={48}
                  height={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition truncate">
                      {player.name}
                    </h3>
                    {player.isOp && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-1.5 rounded shrink-0">
                        OP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {player.world} • {player.x.toFixed(0)}, {player.y.toFixed(0)},{" "}
                    {player.z.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  {player.health.toFixed(0)} HP
                </span>
                <span>{player.gamemode}</span>
                <span>{player.ping}ms</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

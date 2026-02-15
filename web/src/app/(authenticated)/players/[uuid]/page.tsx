"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { PlayerDetail, InventoryResponse, EnderChestResponse } from "@/types";
import InventoryGrid from "@/components/InventoryGrid";
import CommandModal from "@/components/CommandModal";
import {
  Heart,
  Drumstick,
  Sparkles,
  MapPin,
  Copy,
  Check,
  Sword,
  PackageOpen,
  Zap,
  Shield,
} from "lucide-react";

type Tab = "overview" | "inventory" | "enderchest" | "actions";

export default function PlayerDetailPage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const { hasRole } = useAuth();

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [enderChest, setEnderChest] = useState<EnderChestResponse | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [commandModal, setCommandModal] = useState<{ type: string; playerName: string } | null>(null);

  const fetchPlayer = useCallback(async () => {
    try {
      const data = await apiFetch<PlayerDetail>(`/mc/player/${uuid}`);
      setPlayer(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch player");
    }
  }, [uuid]);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await apiFetch<InventoryResponse>(`/mc/player/${uuid}/inventory`);
      setInventory(data);
    } catch {
      setInventory(null);
    }
  }, [uuid]);

  const fetchEnderChest = useCallback(async () => {
    try {
      const data = await apiFetch<EnderChestResponse>(`/mc/player/${uuid}/enderchest`);
      setEnderChest(data);
    } catch {
      setEnderChest(null);
    }
  }, [uuid]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  useEffect(() => {
    if (tab === "inventory" && !inventory && hasRole("MOD")) fetchInventory();
    if (tab === "enderchest" && !enderChest && hasRole("MOD")) fetchEnderChest();
  }, [tab, inventory, enderChest, hasRole, fetchInventory, fetchEnderChest]);

  const copyCoords = () => {
    if (!player) return;
    const text = `${player.x.toFixed(0)} ${player.y.toFixed(0)} ${player.z.toFixed(0)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        <p className="text-lg font-semibold">Error</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-pulse">Loading player...</div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Sparkles className="w-4 h-4" /> },
    { id: "inventory", label: "Inventory", icon: <PackageOpen className="w-4 h-4" /> },
    { id: "enderchest", label: "Ender Chest", icon: <Shield className="w-4 h-4" /> },
    { id: "actions", label: "Actions", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={`https://mc-heads.net/avatar/${uuid}/64`}
          alt={player.name}
          className="w-16 h-16 rounded-xl"
          width={64}
          height={64}
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{player.name}</h1>
            {player.isOp && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                OP
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono">{player.uuid}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-1 border border-border w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">World</span>
                <span className="text-foreground">{player.world}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coordinates</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground">
                    {player.x.toFixed(0)}, {player.y.toFixed(0)}, {player.z.toFixed(0)}
                  </span>
                  <button
                    onClick={copyCoords}
                    className="p-1 rounded hover:bg-secondary transition"
                    title="Copy coordinates"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gamemode</span>
                <span className="text-foreground">{player.gamemode}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health</span>
                <span className="text-red-400">
                  {player.health.toFixed(1)} / {player.maxHealth.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Food</span>
                <span className="text-yellow-400 flex items-center gap-1">
                  <Drumstick className="w-3.5 h-3.5" />
                  {player.food}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Level</span>
                <span className="text-green-400">{player.expLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ping</span>
                <span className="text-foreground">{player.ping}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flying</span>
                <span className="text-foreground">{player.isFlying ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Active effects */}
          {player.activePotionEffects.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 md:col-span-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Active Effects
              </h3>
              <div className="flex flex-wrap gap-2">
                {player.activePotionEffects.map((eff, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                  >
                    {eff.type} {eff.amplifier > 0 ? `${eff.amplifier + 1}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inventory summary */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 md:col-span-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sword className="w-4 h-4 text-blue-400" />
              Inventory Summary
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(player.inventorySummary).map(([item, count]) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-secondary text-foreground text-xs rounded-lg"
                >
                  {item.replace(/_/g, " ")}: {count}
                </span>
              ))}
              {Object.keys(player.inventorySummary).length === 0 && (
                <span className="text-sm text-muted-foreground">Empty inventory</span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div>
          {!hasRole("MOD") ? (
            <NoPermission />
          ) : inventory ? (
            <InventoryGrid inventory={inventory} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Loading inventory...
            </div>
          )}
        </div>
      )}

      {tab === "enderchest" && (
        <div>
          {!hasRole("MOD") ? (
            <NoPermission />
          ) : enderChest ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Ender Chest</h3>
              <div className="grid grid-cols-9 gap-1">
                {enderChest.contents.map((item, i) => (
                  <ItemSlot key={i} item={item} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Loading ender chest...
            </div>
          )}
        </div>
      )}

      {tab === "actions" && (
        <div>
          {!hasRole("MOD") ? (
            <NoPermission />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionButton
                label="Send Message (Say)"
                description="Send a chat message as the server"
                color="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                onClick={() => setCommandModal({ type: "say", playerName: player.name })}
              />
              <ActionButton
                label="Kick Player"
                description="Kick this player from the server"
                color="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                onClick={() => setCommandModal({ type: "kick", playerName: player.name })}
              />
              <ActionButton
                label="Tempban Player"
                description="Temporarily ban this player"
                color="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                onClick={() => setCommandModal({ type: "tempban", playerName: player.name })}
              />
            </div>
          )}
        </div>
      )}

      {/* Command confirmation modal */}
      {commandModal && (
        <CommandModal
          type={commandModal.type}
          playerName={commandModal.playerName}
          onClose={() => setCommandModal(null)}
        />
      )}
    </div>
  );
}

function NoPermission() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>You don&apos;t have permission to view this.</p>
      <p className="text-xs mt-1">Requires MOD or ADMIN role.</p>
    </div>
  );
}

function ActionButton({
  label,
  description,
  color,
  onClick,
}: {
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-xl border border-border text-left transition ${color}`}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-xs opacity-70 mt-1">{description}</p>
    </button>
  );
}

function ItemSlot({ item }: { item: { empty: boolean; material?: string; amount?: number; displayName?: string; enchantments?: Record<string, number>; lore?: string[] } }) {
  if (item.empty) {
    return <div className="w-10 h-10 bg-secondary/50 rounded border border-border/30" />;
  }

  return (
    <div
      className="w-10 h-10 bg-secondary rounded border border-border/50 flex items-center justify-center relative group cursor-default"
      title={item.displayName || item.material?.replace(/_/g, " ") || ""}
    >
      <span className="text-[8px] text-center leading-tight text-foreground truncate px-0.5">
        {(item.material || "").replace(/_/g, " ").slice(0, 6)}
      </span>
      {item.amount && item.amount > 1 && (
        <span className="absolute -bottom-0.5 -right-0.5 text-[7px] bg-black/70 text-white px-0.5 rounded">
          {item.amount}
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs min-w-[150px] shadow-xl">
          <p className="font-semibold text-white">
            {item.displayName || item.material?.replace(/_/g, " ")}
          </p>
          {item.amount && <p className="text-gray-400">Quantity: {item.amount}</p>}
          {item.enchantments &&
            Object.entries(item.enchantments).map(([enc, lvl]) => (
              <p key={enc} className="text-purple-400">
                {enc.replace(/_/g, " ")} {lvl}
              </p>
            ))}
          {item.lore?.map((line, i) => (
            <p key={i} className="text-gray-500 italic">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

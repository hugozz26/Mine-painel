"use client";

import type { InventoryResponse, InventoryItem } from "@/types";

interface Props {
  inventory: InventoryResponse;
}

/**
 * Renders a Minecraft-style inventory grid (9×4 + armor + offhand).
 */
export default function InventoryGrid({ inventory }: Props) {
  // Hotbar is slots 0-8, rest is 9-35
  const hotbar = inventory.contents.filter((i) => i.slot !== undefined && i.slot < 9);
  const mainInv = inventory.contents.filter((i) => i.slot !== undefined && i.slot >= 9);

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Armor + Offhand */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Armor & Offhand</h3>
        <div className="flex gap-2">
          {[...inventory.armor].reverse().map((item, i) => (
            <SlotBox key={`armor-${i}`} item={item} label={item.slotName} />
          ))}
          <div className="w-2" />
          <SlotBox item={inventory.offhand} label="offhand" />
        </div>
      </div>

      {/* Main inventory (3 rows of 9) */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Inventory</h3>
        <div className="grid grid-cols-9 gap-1">
          {mainInv.map((item, i) => (
            <SlotBox key={`main-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Hotbar */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Hotbar</h3>
        <div className="grid grid-cols-9 gap-1">
          {hotbar.map((item, i) => (
            <SlotBox key={`hotbar-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotBox({ item, label }: { item: InventoryItem; label?: string }) {
  const isEmpty = item.empty;

  return (
    <div className="relative group">
      <div
        className={`w-12 h-12 rounded border flex flex-col items-center justify-center ${
          isEmpty
            ? "bg-secondary/30 border-border/30"
            : "bg-secondary border-border/60 cursor-default"
        }`}
      >
        {!isEmpty && (
          <>
            <span className="text-[8px] text-center leading-tight text-foreground truncate px-0.5 max-w-full">
              {(item.material || "").replace(/_/g, " ").slice(0, 8)}
            </span>
            {item.amount && item.amount > 1 && (
              <span className="absolute bottom-0 right-0.5 text-[8px] font-bold text-white bg-black/60 px-0.5 rounded">
                {item.amount}
              </span>
            )}
            {item.enchantments && Object.keys(item.enchantments).length > 0 && (
              <span className="absolute top-0 right-0.5 text-[6px] text-purple-400">✦</span>
            )}
          </>
        )}
      </div>

      {label && (
        <span className="block text-[8px] text-center text-muted-foreground mt-0.5 capitalize">
          {label}
        </span>
      )}

      {/* Hover tooltip */}
      {!isEmpty && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs min-w-[180px] shadow-xl whitespace-nowrap">
            <p className="font-bold text-white">
              {item.displayName || item.material?.replace(/_/g, " ")}
            </p>
            <p className="text-gray-400">Quantity: {item.amount || 1}</p>
            {item.damage !== undefined && item.maxDurability !== undefined && item.maxDurability > 0 && (
              <p className="text-gray-400">
                Durability: {item.maxDurability - item.damage}/{item.maxDurability}
              </p>
            )}
            {item.enchantments &&
              Object.entries(item.enchantments).map(([enc, lvl]) => (
                <p key={enc} className="text-purple-400 capitalize">
                  {enc.replace(/_/g, " ")} {lvl}
                </p>
              ))}
            {item.lore?.map((line, i) => (
              <p key={i} className="text-gray-500 italic">
                {line}
              </p>
            ))}
            {item.customModelData !== undefined && (
              <p className="text-gray-500">CMD: {item.customModelData}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

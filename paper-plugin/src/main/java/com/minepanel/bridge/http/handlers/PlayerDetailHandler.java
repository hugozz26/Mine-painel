package com.minepanel.bridge.http.handlers;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.config.PluginConfig;
import com.minepanel.bridge.http.HttpApiServer;
import com.minepanel.bridge.serialization.ItemSerializer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.PlayerInventory;
import org.bukkit.potion.PotionEffect;

import java.io.IOException;
import java.util.UUID;

/**
 * GET /api/player/:uuid          -> player detail
 * GET /api/player/:uuid/inventory  -> inventory (if enabled)
 * GET /api/player/:uuid/enderchest -> ender chest (if enabled)
 */
public class PlayerDetailHandler implements HttpHandler {

    private final MinePanelBridge plugin;
    private final PluginConfig config;

    public PlayerDetailHandler(MinePanelBridge plugin, PluginConfig config) {
        this.plugin = plugin;
        this.config = config;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpApiServer.sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        // Parse path: /api/player/<uuid>[/inventory|/enderchest]
        String path = exchange.getRequestURI().getPath();
        String afterPrefix = path.substring("/api/player/".length());

        String[] parts = afterPrefix.split("/", 2);
        String uuidStr = parts[0];
        String subPath = parts.length > 1 ? parts[1] : "";

        // Validate UUID
        UUID uuid;
        try {
            uuid = UUID.fromString(uuidStr);
        } catch (IllegalArgumentException e) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid UUID format\"}");
            return;
        }

        Player player = Bukkit.getPlayer(uuid);
        if (player == null || !player.isOnline()) {
            HttpApiServer.sendResponse(exchange, 404, "{\"error\":\"Player not found or offline\"}");
            return;
        }

        switch (subPath) {
            case "inventory":
                handleInventory(exchange, player);
                break;
            case "enderchest":
                handleEnderChest(exchange, player);
                break;
            default:
                handleDetail(exchange, player);
                break;
        }
    }

    private void handleDetail(HttpExchange exchange, Player player) throws IOException {
        JsonObject json = new JsonObject();
        Location loc = player.getLocation();

        json.addProperty("uuid", player.getUniqueId().toString());
        json.addProperty("name", player.getName());
        json.addProperty("world", loc.getWorld().getName());
        json.addProperty("x", Math.round(loc.getX() * 100.0) / 100.0);
        json.addProperty("y", Math.round(loc.getY() * 100.0) / 100.0);
        json.addProperty("z", Math.round(loc.getZ() * 100.0) / 100.0);
        json.addProperty("yaw", Math.round(loc.getYaw() * 100.0) / 100.0);
        json.addProperty("pitch", Math.round(loc.getPitch() * 100.0) / 100.0);
        json.addProperty("health", player.getHealth());
        json.addProperty("maxHealth", player.getMaxHealth());
        json.addProperty("food", player.getFoodLevel());
        json.addProperty("saturation", player.getSaturation());
        json.addProperty("expLevel", player.getLevel());
        json.addProperty("exp", player.getExp());
        json.addProperty("totalExperience", player.getTotalExperience());
        json.addProperty("gamemode", player.getGameMode().name());
        json.addProperty("ping", player.getPing());
        json.addProperty("isOp", player.isOp());
        json.addProperty("isFlying", player.isFlying());
        json.addProperty("isSneaking", player.isSneaking());

        // Active potion effects
        JsonArray effects = new JsonArray();
        for (PotionEffect effect : player.getActivePotionEffects()) {
            JsonObject eff = new JsonObject();
            eff.addProperty("type", effect.getType().getKey().getKey());
            eff.addProperty("amplifier", effect.getAmplifier());
            eff.addProperty("duration", effect.getDuration());
            effects.add(eff);
        }
        json.add("activePotionEffects", effects);

        // Inventory summary (top items by count)
        JsonObject invSummary = new JsonObject();
        PlayerInventory inv = player.getInventory();
        for (ItemStack stack : inv.getContents()) {
            if (stack != null && !stack.getType().isAir()) {
                String key = stack.getType().getKey().getKey();
                int current = invSummary.has(key) ? invSummary.get(key).getAsInt() : 0;
                invSummary.addProperty(key, current + stack.getAmount());
            }
        }
        json.add("inventorySummary", invSummary);

        HttpApiServer.sendResponse(exchange, 200, json.toString());
    }

    private void handleInventory(HttpExchange exchange, Player player) throws IOException {
        if (!config.isEnableInventoryView()) {
            HttpApiServer.sendResponse(exchange, 403, "{\"error\":\"Inventory view is disabled\"}");
            return;
        }

        PlayerInventory inv = player.getInventory();
        JsonObject result = new JsonObject();

        // Main contents (slots 0-35)
        JsonArray contents = new JsonArray();
        for (int i = 0; i < 36; i++) {
            ItemStack stack = inv.getItem(i);
            contents.add(ItemSerializer.serialize(stack, i));
        }
        result.add("contents", contents);

        // Armor slots
        JsonArray armor = new JsonArray();
        ItemStack[] armorContents = inv.getArmorContents();
        String[] armorNames = {"boots", "leggings", "chestplate", "helmet"};
        for (int i = 0; i < armorContents.length; i++) {
            JsonObject slot = ItemSerializer.serialize(armorContents[i], -1);
            slot.addProperty("slotName", armorNames[i]);
            armor.add(slot);
        }
        result.add("armor", armor);

        // Offhand
        result.add("offhand", ItemSerializer.serialize(inv.getItemInOffHand(), -1));

        HttpApiServer.sendResponse(exchange, 200, result.toString());
    }

    private void handleEnderChest(HttpExchange exchange, Player player) throws IOException {
        if (!config.isEnableEnderChestView()) {
            HttpApiServer.sendResponse(exchange, 403, "{\"error\":\"Ender chest view is disabled\"}");
            return;
        }

        JsonArray contents = new JsonArray();
        for (int i = 0; i < player.getEnderChest().getSize(); i++) {
            ItemStack stack = player.getEnderChest().getItem(i);
            contents.add(ItemSerializer.serialize(stack, i));
        }

        JsonObject result = new JsonObject();
        result.add("contents", contents);

        HttpApiServer.sendResponse(exchange, 200, result.toString());
    }
}

package com.minepanel.bridge.http.handlers;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.http.HttpApiServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;

import java.io.IOException;

/**
 * GET /api/players
 * Returns a list of all online players with basic info.
 */
public class PlayersHandler implements HttpHandler {

    private final MinePanelBridge plugin;

    public PlayersHandler(MinePanelBridge plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpApiServer.sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        JsonArray players = new JsonArray();

        for (Player player : Bukkit.getOnlinePlayers()) {
            JsonObject pj = new JsonObject();
            Location loc = player.getLocation();

            pj.addProperty("uuid", player.getUniqueId().toString());
            pj.addProperty("name", player.getName());
            pj.addProperty("world", loc.getWorld().getName());
            pj.addProperty("x", Math.round(loc.getX() * 100.0) / 100.0);
            pj.addProperty("y", Math.round(loc.getY() * 100.0) / 100.0);
            pj.addProperty("z", Math.round(loc.getZ() * 100.0) / 100.0);
            pj.addProperty("yaw", Math.round(loc.getYaw() * 100.0) / 100.0);
            pj.addProperty("pitch", Math.round(loc.getPitch() * 100.0) / 100.0);
            pj.addProperty("health", player.getHealth());
            pj.addProperty("food", player.getFoodLevel());
            pj.addProperty("expLevel", player.getLevel());
            pj.addProperty("gamemode", player.getGameMode().name());
            pj.addProperty("ping", player.getPing());
            pj.addProperty("isOp", player.isOp());

            players.add(pj);
        }

        HttpApiServer.sendResponse(exchange, 200, players.toString());
    }
}

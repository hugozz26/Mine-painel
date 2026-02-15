package com.minepanel.bridge.http.handlers;

import com.google.gson.JsonObject;
import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.http.HttpApiServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bukkit.Bukkit;

import java.io.IOException;

/**
 * GET /api/health
 * Returns server status info.
 */
public class HealthHandler implements HttpHandler {

    private final MinePanelBridge plugin;

    public HealthHandler(MinePanelBridge plugin) {
        this.plugin = plugin;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpApiServer.sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        JsonObject json = new JsonObject();
        json.addProperty("ok", true);
        json.addProperty("serverName", Bukkit.getServer().getName());
        json.addProperty("version", Bukkit.getServer().getVersion());
        json.addProperty("onlinePlayers", Bukkit.getOnlinePlayers().size());
        json.addProperty("maxPlayers", Bukkit.getMaxPlayers());
        json.addProperty("motd", Bukkit.getServer().getMotd());
        json.addProperty("tps", Math.round(Bukkit.getServer().getTPS()[0] * 100.0) / 100.0);

        HttpApiServer.sendResponse(exchange, 200, json.toString());
    }
}

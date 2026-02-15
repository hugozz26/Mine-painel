package com.minepanel.bridge.http.handlers;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.audit.AuditLogger;
import com.minepanel.bridge.http.HttpApiServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * GET  /api/whitelist        -> list whitelisted players
 * POST /api/whitelist/add    -> add player to whitelist
 * POST /api/whitelist/remove -> remove player from whitelist
 */
public class WhitelistHandler implements HttpHandler {

    private static final Pattern NICK_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,16}$");

    private final MinePanelBridge plugin;
    private final AuditLogger auditLogger;

    public WhitelistHandler(MinePanelBridge plugin, AuditLogger auditLogger) {
        this.plugin = plugin;
        this.auditLogger = auditLogger;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String actor = exchange.getRequestHeaders().getFirst("X-Panel-Actor");

        if (path.equals("/api/whitelist") && method.equals("GET")) {
            handleList(exchange);
        } else if (path.equals("/api/whitelist/add") && method.equals("POST")) {
            handleAdd(exchange, actor);
        } else if (path.equals("/api/whitelist/remove") && method.equals("POST")) {
            handleRemove(exchange, actor);
        } else {
            HttpApiServer.sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
        }
    }

    private void handleList(HttpExchange exchange) throws IOException {
        JsonArray list = new JsonArray();
        for (OfflinePlayer player : Bukkit.getWhitelistedPlayers()) {
            JsonObject entry = new JsonObject();
            entry.addProperty("name", player.getName());
            entry.addProperty("uuid", player.getUniqueId().toString());
            list.add(entry);
        }
        HttpApiServer.sendResponse(exchange, 200, list.toString());
    }

    private void handleAdd(HttpExchange exchange, String actor) throws IOException {
        String body = HttpApiServer.readBody(exchange);
        JsonObject json;
        try {
            json = JsonParser.parseString(body).getAsJsonObject();
        } catch (Exception e) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
            return;
        }

        String name = json.has("name") ? json.get("name").getAsString() : null;
        if (name == null || !NICK_PATTERN.matcher(name).matches()) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid player name\"}");
            return;
        }

        // Execute whitelist add on main thread
        Bukkit.getScheduler().runTask(plugin, () -> {
            Bukkit.getServer().dispatchCommand(Bukkit.getConsoleSender(), "whitelist add " + name);
        });

        auditLogger.log(actor, "/api/whitelist/add", "WHITELIST_ADD", "name=" + name);

        JsonObject resp = new JsonObject();
        resp.addProperty("ok", true);
        resp.addProperty("message", "Player " + name + " added to whitelist");
        HttpApiServer.sendResponse(exchange, 200, resp.toString());
    }

    private void handleRemove(HttpExchange exchange, String actor) throws IOException {
        String body = HttpApiServer.readBody(exchange);
        JsonObject json;
        try {
            json = JsonParser.parseString(body).getAsJsonObject();
        } catch (Exception e) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
            return;
        }

        String name = json.has("name") ? json.get("name").getAsString() : null;
        if (name == null || !NICK_PATTERN.matcher(name).matches()) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid player name\"}");
            return;
        }

        Bukkit.getScheduler().runTask(plugin, () -> {
            Bukkit.getServer().dispatchCommand(Bukkit.getConsoleSender(), "whitelist remove " + name);
        });

        auditLogger.log(actor, "/api/whitelist/remove", "WHITELIST_REMOVE", "name=" + name);

        JsonObject resp = new JsonObject();
        resp.addProperty("ok", true);
        resp.addProperty("message", "Player " + name + " removed from whitelist");
        HttpApiServer.sendResponse(exchange, 200, resp.toString());
    }
}

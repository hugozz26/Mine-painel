package com.minepanel.bridge.http.handlers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.audit.AuditLogger;
import com.minepanel.bridge.config.PluginConfig;
import com.minepanel.bridge.http.HttpApiServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bukkit.Bukkit;

import java.io.IOException;

/**
 * POST /api/command
 * Executes a whitelisted command on the server console.
 * Body: { "command": "say", "args": ["Hello world"] }
 */
public class CommandHandler implements HttpHandler {

    private final MinePanelBridge plugin;
    private final PluginConfig config;
    private final AuditLogger auditLogger;

    public CommandHandler(MinePanelBridge plugin, PluginConfig config, AuditLogger auditLogger) {
        this.plugin = plugin;
        this.config = config;
        this.auditLogger = auditLogger;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpApiServer.sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        String actor = exchange.getRequestHeaders().getFirst("X-Panel-Actor");
        String body = HttpApiServer.readBody(exchange);

        JsonObject json;
        try {
            json = JsonParser.parseString(body).getAsJsonObject();
        } catch (Exception e) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
            return;
        }

        String command = json.has("command") ? json.get("command").getAsString().trim() : null;
        if (command == null || command.isEmpty()) {
            HttpApiServer.sendResponse(exchange, 400, "{\"error\":\"Missing command\"}");
            return;
        }

        // Build full command string
        StringBuilder fullCommand = new StringBuilder(command);
        if (json.has("args") && json.get("args").isJsonArray()) {
            for (var arg : json.getAsJsonArray("args")) {
                fullCommand.append(" ").append(arg.getAsString());
            }
        }

        String cmdStr = fullCommand.toString();

        // Check if command is whitelisted
        if (!config.isCommandAllowed(cmdStr)) {
            auditLogger.log(actor, "/api/command", "COMMAND_DENIED", "cmd=" + cmdStr);
            HttpApiServer.sendResponse(exchange, 403,
                    "{\"error\":\"Command not allowed: " + command + "\"}");
            return;
        }

        // Execute on main thread
        Bukkit.getScheduler().runTask(plugin, () -> {
            Bukkit.getServer().dispatchCommand(Bukkit.getConsoleSender(), cmdStr);
        });

        auditLogger.log(actor, "/api/command", "COMMAND_EXEC", "cmd=" + cmdStr);

        JsonObject resp = new JsonObject();
        resp.addProperty("ok", true);
        resp.addProperty("message", "Command dispatched: " + cmdStr);
        HttpApiServer.sendResponse(exchange, 200, resp.toString());
    }
}

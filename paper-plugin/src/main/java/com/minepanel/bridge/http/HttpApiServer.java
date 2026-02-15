package com.minepanel.bridge.http;

import com.minepanel.bridge.MinePanelBridge;
import com.minepanel.bridge.audit.AuditLogger;
import com.minepanel.bridge.config.PluginConfig;
import com.minepanel.bridge.http.handlers.*;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * Lightweight HTTP server using Java's built-in com.sun.net.httpserver.
 * Binds to the configured address (default 127.0.0.1) and port.
 */
public class HttpApiServer {

    private final MinePanelBridge plugin;
    private final PluginConfig config;
    private final AuditLogger auditLogger;
    private HttpServer server;

    public HttpApiServer(MinePanelBridge plugin, PluginConfig config, AuditLogger auditLogger) {
        this.plugin = plugin;
        this.config = config;
        this.auditLogger = auditLogger;
    }

    public void start() throws IOException {
        InetSocketAddress address = new InetSocketAddress(config.getBindAddress(), config.getPort());
        server = HttpServer.create(address, 0);

        // Register all endpoint handlers
        server.createContext("/api/health", wrap(new HealthHandler(plugin)));
        server.createContext("/api/players", wrap(new PlayersHandler(plugin)));
        server.createContext("/api/player/", wrap(new PlayerDetailHandler(plugin, config)));
        server.createContext("/api/whitelist", wrap(new WhitelistHandler(plugin, auditLogger)));
        server.createContext("/api/command", wrap(new CommandHandler(plugin, config, auditLogger)));

        server.setExecutor(null); // default executor
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    /**
     * Wraps a handler with shared-secret authentication.
     */
    private com.sun.net.httpserver.HttpHandler wrap(com.sun.net.httpserver.HttpHandler handler) {
        return exchange -> {
            // Check shared secret
            String secret = exchange.getRequestHeaders().getFirst("X-Panel-Secret");
            if (secret == null || !secret.equals(config.getSharedSecret())) {
                sendResponse(exchange, 401, "{\"error\":\"Unauthorized\"}");
                return;
            }
            // Delegate to actual handler
            try {
                handler.handle(exchange);
            } catch (Exception e) {
                plugin.getLogger().severe("API error: " + e.getMessage());
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Internal server error\"}");
            }
        };
    }

    public static void sendResponse(HttpExchange exchange, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }
}

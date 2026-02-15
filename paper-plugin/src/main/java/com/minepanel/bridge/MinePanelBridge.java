package com.minepanel.bridge;

import com.minepanel.bridge.config.PluginConfig;
import com.minepanel.bridge.http.HttpApiServer;
import com.minepanel.bridge.audit.AuditLogger;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * MinePanelBridge — Paper plugin that exposes a local HTTP API
 * for the MinePanel backend to communicate with the Minecraft server.
 *
 * SECURITY: The HTTP server binds to 127.0.0.1 by default.
 * Never expose it to the public internet.
 */
public class MinePanelBridge extends JavaPlugin {

    private HttpApiServer httpServer;
    private AuditLogger auditLogger;
    private PluginConfig pluginConfig;

    @Override
    public void onEnable() {
        // Save default config if not present
        saveDefaultConfig();
        reloadConfig();

        // Load configuration
        pluginConfig = new PluginConfig(getConfig());

        // Warn if bind address is not localhost
        if (!pluginConfig.getBindAddress().equals("127.0.0.1")
                && !pluginConfig.getBindAddress().equals("localhost")) {
            getLogger().warning("==============================================");
            getLogger().warning("WARNING: bindAddress is NOT localhost!");
            getLogger().warning("Current: " + pluginConfig.getBindAddress());
            getLogger().warning("This is a SECURITY RISK. The API should only");
            getLogger().warning("be accessible locally. Use a reverse proxy.");
            getLogger().warning("==============================================");
        }

        if (pluginConfig.getSharedSecret().equals("CHANGE-ME-TO-A-STRONG-SECRET")) {
            getLogger().severe("==============================================");
            getLogger().severe("CRITICAL: sharedSecret is still the default!");
            getLogger().severe("Change it in config.yml and restart the server.");
            getLogger().severe("==============================================");
        }

        // Initialize audit logger
        auditLogger = new AuditLogger(getDataFolder(), pluginConfig.getLogFile());

        // Start HTTP server
        try {
            httpServer = new HttpApiServer(this, pluginConfig, auditLogger);
            httpServer.start();
            getLogger().info("MinePanelBridge HTTP API started on "
                    + pluginConfig.getBindAddress() + ":" + pluginConfig.getPort());
        } catch (Exception e) {
            getLogger().severe("Failed to start HTTP API server: " + e.getMessage());
            e.printStackTrace();
        }

        getLogger().info("MinePanelBridge enabled.");
    }

    @Override
    public void onDisable() {
        if (httpServer != null) {
            httpServer.stop();
            getLogger().info("MinePanelBridge HTTP API stopped.");
        }
        if (auditLogger != null) {
            auditLogger.close();
        }
        getLogger().info("MinePanelBridge disabled.");
    }

    public PluginConfig getPluginConfig() {
        return pluginConfig;
    }
}

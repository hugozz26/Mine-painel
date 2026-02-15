package com.minepanel.bridge.config;

import org.bukkit.configuration.file.FileConfiguration;

import java.util.List;

/**
 * Holds all configuration values loaded from config.yml.
 */
public class PluginConfig {

    private final String bindAddress;
    private final int port;
    private final String sharedSecret;
    private final List<String> allowedCommands;
    private final boolean enableInventoryView;
    private final boolean enableEnderChestView;
    private final String logFile;

    public PluginConfig(FileConfiguration config) {
        this.bindAddress = config.getString("bindAddress", "127.0.0.1");
        this.port = config.getInt("port", 8765);
        this.sharedSecret = config.getString("sharedSecret", "CHANGE-ME-TO-A-STRONG-SECRET");
        this.allowedCommands = config.getStringList("allowedCommands");
        this.enableInventoryView = config.getBoolean("enableInventoryView", true);
        this.enableEnderChestView = config.getBoolean("enableEnderChestView", true);
        this.logFile = config.getString("logFile", "panel-audit.log");
    }

    public String getBindAddress() { return bindAddress; }
    public int getPort() { return port; }
    public String getSharedSecret() { return sharedSecret; }
    public List<String> getAllowedCommands() { return allowedCommands; }
    public boolean isEnableInventoryView() { return enableInventoryView; }
    public boolean isEnableEnderChestView() { return enableEnderChestView; }
    public String getLogFile() { return logFile; }

    /**
     * Check if a command (with optional sub-command) is allowed.
     * E.g. "whitelist add" or "kick".
     */
    public boolean isCommandAllowed(String command) {
        String normalized = command.trim().toLowerCase();
        for (String allowed : allowedCommands) {
            if (normalized.startsWith(allowed.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}

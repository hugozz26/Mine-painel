package com.minepanel.bridge.audit;

import java.io.*;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

/**
 * Simple file-based audit logger for the plugin.
 * Records every action performed via the panel API.
 */
public class AuditLogger {

    private PrintWriter writer;

    public AuditLogger(File dataFolder, String logFileName) {
        try {
            if (!dataFolder.exists()) {
                dataFolder.mkdirs();
            }
            File logFile = new File(dataFolder, logFileName);
            writer = new PrintWriter(new BufferedWriter(new FileWriter(logFile, true)), true);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Log an audit entry.
     *
     * @param actor    The panel user who performed the action (from X-Panel-Actor header)
     * @param endpoint The API endpoint called
     * @param action   A human-readable description of the action
     * @param payload  Summarized payload (no sensitive data)
     */
    public synchronized void log(String actor, String endpoint, String action, String payload) {
        if (writer == null) return;

        String timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        String entry = String.format("[%s] actor=%s endpoint=%s action=%s payload=%s",
                timestamp, actor != null ? actor : "unknown", endpoint, action,
                payload != null ? payload : "");
        writer.println(entry);
    }

    public void close() {
        if (writer != null) {
            writer.close();
        }
    }
}

/**
 * Service to proxy requests from the backend to the MinePanelBridge plugin.
 * Only the backend knows the plugin's sharedSecret.
 */

const PLUGIN_BASE_URL = process.env.PLUGIN_BASE_URL || "http://127.0.0.1:8765";
const PLUGIN_SECRET = process.env.PLUGIN_SHARED_SECRET || "";

interface PluginRequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  actor?: string;
}

interface PluginResponse {
  status: number;
  data: unknown;
}

/**
 * Make a request to the plugin HTTP API.
 */
export async function pluginFetch(options: PluginRequestOptions): Promise<PluginResponse> {
  const { method = "GET", path, body, actor } = options;

  const url = `${PLUGIN_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Panel-Secret": PLUGIN_SECRET,
  };

  if (actor) {
    headers["X-Panel-Actor"] = actor;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    return { status: response.status, data };
  } catch (err) {
    console.error(`[PluginProxy] Error calling ${url}:`, err);
    return { status: 502, data: { error: "Plugin unreachable" } };
  }
}

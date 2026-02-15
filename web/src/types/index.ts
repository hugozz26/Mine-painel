/** User roles */
export type Role = "VIEWER" | "MOD" | "ADMIN";

/** Authenticated user from login response */
export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

/** Login response */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/** Server health */
export interface ServerHealth {
  ok: boolean;
  serverName: string;
  version: string;
  onlinePlayers: number;
  maxPlayers: number;
  motd?: string;
  tps?: number;
}

/** Online player (list) */
export interface PlayerSummary {
  uuid: string;
  name: string;
  world: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  food: number;
  expLevel: number;
  gamemode: string;
  ping: number;
  isOp: boolean;
}

/** Player detail */
export interface PlayerDetail extends PlayerSummary {
  maxHealth: number;
  saturation: number;
  exp: number;
  totalExperience: number;
  isFlying: boolean;
  isSneaking: boolean;
  activePotionEffects: PotionEffect[];
  inventorySummary: Record<string, number>;
}

export interface PotionEffect {
  type: string;
  amplifier: number;
  duration: number;
}

/** Inventory item */
export interface InventoryItem {
  slot?: number;
  empty: boolean;
  material?: string;
  amount?: number;
  displayName?: string;
  lore?: string[];
  enchantments?: Record<string, number>;
  damage?: number;
  maxDurability?: number;
  customModelData?: number;
  slotName?: string;
}

/** Inventory response */
export interface InventoryResponse {
  contents: InventoryItem[];
  armor: InventoryItem[];
  offhand: InventoryItem;
}

/** Ender chest response */
export interface EnderChestResponse {
  contents: InventoryItem[];
}

/** Whitelist entry */
export interface WhitelistEntry {
  name: string;
  uuid: string;
}

/** Audit log entry */
export interface AuditLogEntry {
  id: number;
  actorUsername: string;
  actorRole: string;
  ip: string;
  action: string;
  target: string | null;
  detailsJson: string | null;
  createdAt: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Panel user (from /users) */
export interface PanelUser {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
}

/** User roles */
export type Role = "VIEWER" | "MOD" | "ADMIN";

/** Role hierarchy for permission checks */
const ROLE_LEVEL: Record<Role, number> = {
  VIEWER: 1,
  MOD: 2,
  ADMIN: 3,
};

/**
 * Check if a role meets or exceeds the required minimum role.
 */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}

/** JWT payload shape */
export interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}

/** Extend Express Request to include authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

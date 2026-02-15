"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  ScrollText,
  UserCog,
  LogOut,
  List,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "VIEWER" as const },
  { href: "/players", label: "Players", icon: Users, minRole: "VIEWER" as const },
  { href: "/whitelist", label: "Whitelist", icon: List, minRole: "VIEWER" as const },
  { href: "/logs", label: "Audit Logs", icon: ScrollText, minRole: "ADMIN" as const },
  { href: "/users", label: "Users", icon: UserCog, minRole: "ADMIN" as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">MinePanel</h1>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => hasRole(item.minRole))
          .map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                user?.role === "ADMIN" && "bg-red-500/20 text-red-400",
                user?.role === "MOD" && "bg-yellow-500/20 text-yellow-400",
                user?.role === "VIEWER" && "bg-blue-500/20 text-blue-400"
              )}
            >
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-950/30 transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

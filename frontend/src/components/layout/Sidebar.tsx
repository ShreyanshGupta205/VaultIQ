"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Cloud,
    Files,
    BrainCircuit,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Connected Clouds", href: "/dashboard/integrations", icon: Cloud },
    { name: "File Manager", href: "/dashboard/files", icon: Files },
    { name: "Intelligence Center", href: "/dashboard/intelligence", icon: BrainCircuit },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "h-screen sticky top-0 border-r border-white/10 bg-background/50 backdrop-blur-xl transition-all duration-300 flex flex-col z-40 hidden md:flex",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex h-16 items-center border-b border-white/10 px-4 justify-between">
                {!collapsed && (
                    <div className="flex items-center gap-2 text-primary font-bold overflow-hidden whitespace-nowrap">
                        <Cloud className="w-6 h-6 shrink-0" />
                        <span>VaultMind AI</span>
                    </div>
                )}
                {collapsed && (
                    <Cloud className="w-6 h-6 text-primary shrink-0 mx-auto" />
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-white/10 text-muted-foreground transition-colors",
                        collapsed && "mx-auto mt-4 absolute top-16 left-1/2 -translate-x-1/2 border border-white/10 bg-black/50"
                    )}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                            {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
                            {collapsed && (
                                <div className="absolute left-14 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => router.push('/login')}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors group relative",
                        collapsed && "justify-center"
                    )}>
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">Log out</span>}
                    {collapsed && (
                        <div className="absolute left-14 px-2 py-1 bg-popover text-destructive text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-destructive/20">
                            Log out
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
}

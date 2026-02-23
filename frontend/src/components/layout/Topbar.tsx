"use client";

import { Bell, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Topbar() {
    const pathname = usePathname();

    // Format pathname to display title (e.g. /dashboard/files -> Files)
    const getPageTitle = () => {
        if (pathname === "/dashboard") return "Overview";
        const segments = pathname.split("/");
        const last = segments[segments.length - 1];
        if (!last) return "Dashboard";
        return last.charAt(0).toUpperCase() + last.slice(1).replace("-", " ");
    };

    return (
        <header className="h-16 border-b border-white/10 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                    {getPageTitle()}
                </h1>
            </div>

            <div className="flex flex-1 items-center justify-end gap-6">
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search files across clouds... (⌘K)"
                        className="w-full h-9 bg-black/40 border border-white/10 rounded-full pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer">
                        <User className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </header>
    );
}

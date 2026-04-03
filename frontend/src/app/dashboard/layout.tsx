import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CommandPalette from "@/components/layout/CommandPalette";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard | VaultMind AI",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground font-[family-name:var(--font-geist-sans)] selection:bg-primary selection:text-white">
            <Sidebar />
            <CommandPalette />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}

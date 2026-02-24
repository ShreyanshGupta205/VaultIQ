"use client";

import { useState } from "react";
import { Cloud, CheckCircle2, AlertCircle, Plus, Loader2 } from "lucide-react";

export default function IntegrationsPage() {
    const [connecting, setConnecting] = useState<string | null>(null);
    const [providers, setProviders] = useState([
        {
            name: "Google Drive",
            id: "google",
            icon: Cloud,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            status: "connected",
            email: "user@gmail.com",
            used: "120 GB",
            total: "200 GB",
        },
        {
            name: "Dropbox",
            id: "dropbox",
            icon: Cloud,
            color: "text-indigo-500",
            bgColor: "bg-indigo-500/10",
            status: "connected",
            email: "user@work.com",
            used: "85 GB",
            total: "100 GB",
        },
        {
            name: "Microsoft OneDrive",
            id: "onedrive",
            icon: Cloud,
            color: "text-sky-500",
            bgColor: "bg-sky-500/10",
            status: "disconnected",
            email: null,
            used: "0 GB",
            total: "1,000 GB",
        },
    ]);

    const handleConnect = (id: string) => {
        setConnecting(id);
        // Simulate OAuth delay
        setTimeout(() => {
            setProviders(prev => prev.map(p => {
                if (p.id === id) {
                    return { ...p, status: "connected", email: "newuser@outlook.com", used: "4.2 GB" };
                }
                return p;
            }));
            setConnecting(null);
        }, 2000);
    };

    const handleDisconnect = (id: string) => {
        setProviders(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: "disconnected", email: null, used: "0 GB" };
            }
            return p;
        }));
    };

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Connected Clouds</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your cloud storage OAuth connections. VaultMind never stores your files.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 flex flex-col border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors">
                        {/* Background Glow */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] ${provider.bgColor} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                        <div className="flex justify-between items-start mb-6 z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${provider.bgColor} ${provider.color}`}>
                                <provider.icon className="w-6 h-6" />
                            </div>
                            {provider.status === "connected" ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                                    <AlertCircle className="w-3.5 h-3.5" /> Disconnected
                                </span>
                            )}
                        </div>

                        <div className="mb-6 z-10 flex-1">
                            <h3 className="text-lg font-semibold">{provider.name}</h3>
                            {provider.email ? (
                                <p className="text-sm text-muted-foreground">{provider.email}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No account linked</p>
                            )}
                        </div>

                        {provider.status === "connected" ? (
                            <div className="space-y-4 z-10 mt-auto">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Usage</span>
                                        <span>{provider.used} / {provider.total}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${provider.color.replace('text', 'bg')}`}
                                            style={{ width: `${(parseFloat(provider.used) / parseFloat(provider.total.replace(',', ''))) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDisconnect(provider.id)}
                                    className="w-full py-2.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleConnect(provider.id)}
                                disabled={connecting === provider.id}
                                className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] mt-auto z-10 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {connecting === provider.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" /> Connect Account
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

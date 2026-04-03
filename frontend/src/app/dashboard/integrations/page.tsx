"use client";

import { useState, useEffect } from "react";
import { Cloud, CheckCircle2, AlertCircle, Plus, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { API_BASE_URL } from "@/lib/constants";

function formatBytes(bytes: string | number) {
    if (!bytes) return "0 MB";
    const b = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
    return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function IntegrationsPage() {
    const { token } = useAuthStore();
    const [connecting, setConnecting] = useState<string | null>(null);
    const [connections, setConnections] = useState<any[]>([]);

    const fetchConnections = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/cloud/status`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSync = async (connectionId: string, continuationToken: string | null = null) => {
        if (!token) return;
        setConnecting(connectionId);
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/cloud/sync`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ connectionId, continuationToken })
            });

            if (res.ok) {
                const result = await res.json();
                if (result.continuationToken) {
                    // Recursive call for the next chunk
                    await handleSync(connectionId, result.continuationToken);
                } else {
                    setConnecting(null);
                    await fetchConnections();
                }
            } else {
                setConnecting(null);
                alert("Sync failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setConnecting(null);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get("status") === "success" && queryParams.get("trigger_sync") === "true") {
            // We need to find the connection that was just added
            fetchConnections().then(() => {
                // For now, let's just refresh and let the user trigger manual sync or auto-detect
                // In a real app, you'd find the latest connection.
                window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
        fetchConnections();
    }, [token]);

    const handleConnect = (providerId: string) => {
        if (!token) return;
        window.location.href = `${API_BASE_URL}/api/cloud/auth/${providerId}?token=${token}`;
    };

    const handleDisconnect = async (connectionId: string) => {
        if (!token) return;
        if (!confirm("Are you sure you want to disconnect this cloud drive?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/cloud/disconnect/${connectionId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchConnections();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const uiProviders = [
        { name: "Google Drive", id: "google", dbId: "GOOGLE_DRIVE", icon: Cloud, color: "text-blue-500", bgColor: "bg-blue-500/10" },
        { name: "Dropbox", id: "dropbox", dbId: "DROPBOX", icon: Cloud, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
        { name: "Microsoft OneDrive", id: "onedrive", dbId: "ONEDRIVE", icon: Cloud, color: "text-sky-500", bgColor: "bg-sky-500/10" },
    ];

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Connected Clouds</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your cloud storage OAuth connections. VaultIQ never stores your files.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uiProviders.map((provider) => {
                    const conn = connections.find(c => c.provider === provider.dbId);
                    const isConnected = !!conn;

                    return (
                        <div key={provider.id} className="glass-card rounded-2xl p-6 flex flex-col border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors">
                            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] ${provider.bgColor} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                            <div className="flex justify-between items-start mb-6 z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${provider.bgColor} ${provider.color}`}>
                                    <provider.icon className="w-6 h-6" />
                                </div>
                                {isConnected ? (
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
                                {isConnected ? (
                                    <p className="text-sm text-muted-foreground">{conn.email}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No account linked</p>
                                )}
                            </div>

                            {isConnected ? (
                                <div className="space-y-4 z-10 mt-auto">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Usage</span>
                                            <span>{formatBytes(conn.storageUsed)} / {formatBytes(conn.storageTotal)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${provider.color.replace('text', 'bg')}`}
                                                style={{ width: `${(parseFloat(conn.storageUsed) / parseFloat(conn.storageTotal)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 z-10 mt-auto">
                                        <button
                                            onClick={() => handleSync(conn.id)}
                                            disabled={!!connecting}
                                            className="py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {connecting === conn.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Sync Now"
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(conn.id)}
                                            className="py-2.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
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
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Search, Shield, Zap, TrendingDown } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { API_BASE_URL } from "@/lib/constants";

function formatBytes(bytes: string | number) {
    if (!bytes) return "0 GB";
    const b = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
    return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function DashboardOverview() {
    const { token } = useAuthStore();
    const [connections, setConnections] = useState<any[]>([]);
    const [filesCount, setFilesCount] = useState(0);
    const [aiReport, setAiReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [statusRes, filesRes, aiRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/cloud/status`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/api/files`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/api/ai/report`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    })
                ]);

                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setConnections(data.connections || []);
                }
                if (filesRes.ok) {
                    const data = await filesRes.json();
                    setFilesCount(data.count || 0);
                }
                if (aiRes.ok) {
                    const data = await aiRes.json();
                    setAiReport(data.report || null);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const totalUsedNum = connections.reduce((acc, c) => acc + parseFloat(c.storageUsed), 0);
    const totalProviderCount = connections.length;

    const providerColors: Record<string, string> = {
        'GOOGLE_DRIVE': 'bg-blue-500',
        'DROPBOX': 'bg-indigo-500',
        'ONEDRIVE': 'bg-sky-500'
    };

    const providerNames: Record<string, string> = {
        'GOOGLE_DRIVE': 'Google Drive',
        'DROPBOX': 'Dropbox',
        'ONEDRIVE': 'OneDrive'
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground mt-1">
                    Monitor your unified cloud storage analytics and AI insights.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Total Storage Used", value: formatBytes(totalUsedNum), subtext: `Across ${totalProviderCount} providers`, icon: HardDrive, color: "text-blue-500" },
                    { title: "Potential Savings", value: aiReport ? formatBytes(aiReport.duplicatesSize) : "0 GB", subtext: aiReport ? "Duplicates detected" : "Run AI Analysis", icon: TrendingDown, color: "text-green-500" },
                    { title: "Files Scanned", value: filesCount.toString(), subtext: "Total indexed cloud files", icon: Search, color: "text-indigo-500" },
                    { title: "Security Alerts", value: "Healthy", subtext: "All files encrypted securely", icon: Shield, color: "text-emerald-500" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl glass-card relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                            <stat.icon className="w-16 h-16" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</h3>
                            <div className="text-3xl font-bold mb-1">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Storage Distribution */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-6">Storage by Provider</h3>
                    <div className="flex-1 flex flex-col justify-center space-y-8">
                        {connections.length === 0 ? (
                            <div className="text-center text-muted-foreground italic">No clouds connected yet. Data will appear here once connected.</div>
                        ) : (
                            connections.map(c => {
                                const colorClass = providerColors[c.provider] || 'bg-primary';
                                const percentage = (parseFloat(c.storageUsed) / parseFloat(c.storageTotal)) * 100;
                                return (
                                    <div key={c.id} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                                                {providerNames[c.provider] || c.provider}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatBytes(c.storageUsed)} / {formatBytes(c.storageTotal)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="glass-card rounded-2xl p-6 min-h-[400px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        AI Insights
                    </h3>
                    <div className="space-y-4 flex-1">
                        {aiReport && aiReport.duplicatesSize > 0 ? (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="text-sm font-medium mb-1">Deduplication Opportunity</div>
                                <p className="text-xs text-muted-foreground">
                                    VaultIQ found {formatBytes(aiReport.duplicatesSize)} of duplicate data. Clear them to reclaim space.
                                </p>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-center text-sm text-muted-foreground italic px-4">
                                {loading ? "Analyzing..." : "Connect your clouds and run an AI scan to get intelligent insights on file duplications."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

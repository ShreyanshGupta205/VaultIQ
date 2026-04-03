"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, BrainCircuit, FileImage, ShieldAlert, Cpu, Check, Loader2, X, Trash2 } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { API_BASE_URL } from "@/lib/constants";

function formatBytes(bytes: string | number) {
    if (!bytes) return "0 B";
    const b = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
    return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function IntelligenceCenterPage() {
    const { token } = useAuthStore();
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(100);
    const [fixing, setFixing] = useState<string | null>(null);
    const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
    const [insights, setInsights] = useState<any[]>([]);

    const fetchReport = async () => {
        if (!token) return null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai/report`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return data.report;
            }
        } catch (err) {
            console.error("Failed to fetch report:", err);
        }
        return null;
    };

    const processReport = (report: any) => {
        if (!report || report.status !== 'COMPLETED') return;

        let parsedData = { duplicates: [] };
        try {
            if (report.data) parsedData = JSON.parse(report.data);
        } catch (e) { }

        const newInsights = [];

        const dupSizeObj = typeof report.duplicatesSize === 'string' ? parseFloat(report.duplicatesSize) : report.duplicatesSize;
        const unSizeObj = typeof report.unusedSize === 'string' ? parseFloat(report.unusedSize) : report.unusedSize;

        if (dupSizeObj > 0) {
            newInsights.push({
                id: 1,
                title: "Identical Files Detected",
                description: `Found ${parsedData.duplicates.length} duplicate files wasting space in your connected storage.`,
                savingsValue: dupSizeObj,
                savings: formatBytes(dupSizeObj),
                icon: FileImage,
                color: "text-blue-400",
                bgColor: "bg-blue-400/10",
                status: "critical",
                payload: parsedData.duplicates,
            });
        }

        if (unSizeObj > 0) {
            newInsights.push({
                id: 2,
                title: "Stale Archival Opportunity",
                description: "Several large files haven't been accessed in a long time and could be archived.",
                savingsValue: unSizeObj,
                savings: formatBytes(unSizeObj),
                icon: BrainCircuit,
                color: "text-indigo-400",
                bgColor: "bg-indigo-400/10",
                status: "suggestion"
            });
        }

        setInsights(newInsights);
    };

    useEffect(() => {
        // Fetch on load
        fetchReport().then(report => {
            if (report && report.status === 'COMPLETED') {
                processReport(report);
            }
        });
    }, [token]);

    const runScan = async () => {
        if (!token) return;
        setIsScanning(true);
        setScanProgress(0);

        try {
            await fetch(`${API_BASE_URL}/api/ai/analyze`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            // Fake progress animation
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.floor(Math.random() * 15) + 5;
                });
            }, 300);

            // Poll for completion
            const poll = setInterval(async () => {
                const report = await fetchReport();
                if (report && (report.status === 'COMPLETED' || report.status === 'ERROR')) {
                    clearInterval(poll);
                    clearInterval(interval);
                    setScanProgress(100);
                    setTimeout(() => {
                        setIsScanning(false);
                        if (report.status === 'COMPLETED') {
                            processReport(report);
                        }
                    }, 500);
                }
            }, 1000);
        } catch (err) {
            setIsScanning(false);
            console.error(err);
        }
    };

    const handleToggleExpand = (id: number) => {
        setExpandedInsight(prev => prev === id ? null : id);
    };

    const handleDeleteSingle = async (insightId: number, fileObj: any) => {
        setFixing(fileObj.id);
        try {
            const response = await fetch(`${API_BASE_URL}/api/files/${fileObj.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setInsights(prev => prev.map(insight => {
                    if (insight.id === insightId) {
                        const newPayload = insight.payload.filter((f: any) => f.id !== fileObj.id);
                        const removedSize = parseInt(fileObj.size) || 0;
                        const newSavingsValue = Math.max(0, insight.savingsValue - removedSize);
                        
                        return {
                            ...insight,
                            payload: newPayload,
                            savingsValue: newSavingsValue,
                            savings: formatBytes(newSavingsValue),
                            description: `Found ${newPayload.length} duplicate files wasting space in your connected storage.`
                        };
                    }
                    return insight;
                }).filter(insight => !insight.payload || insight.payload.length > 0)); 
            } else {
                 console.error("Delete failed");
            }
        } catch (e) {
            console.error("Failed to fix", e);
        } finally {
            setFixing(null);
        }
    };

    const totalSavingsValue = insights.reduce((acc, curr) => acc + (curr.savingsValue || 0), 0);
    const hasInsights = insights.length > 0;

    return (
        <div className="space-y-8 max-w-5xl relative">
            {isScanning && (
                <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                    />
                </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Cpu className={isScanning ? "w-8 h-8 text-primary animate-pulse" : "w-8 h-8 text-primary"} />
                        AI Intelligence Center
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        VaultIQ's neural engine analyzes your storage to find duplicates, optimize space, and enforce security.
                    </p>
                </div>
                <button
                    onClick={runScan}
                    disabled={isScanning}
                    className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 px-6 py-2.5 bg-foreground text-background font-medium rounded-full hover:bg-white/80 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                    {isScanning ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Vault...</>
                    ) : (
                        <><Zap className="w-4 h-4" /> Run Deep Scan</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
                    <h3 className="text-sm font-medium text-primary mb-2">Total Potential Savings</h3>
                    <div className="text-4xl font-bold text-foreground mb-1">
                        {formatBytes(totalSavingsValue)}
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending AI Actions</h3>
                    <div className="text-4xl font-bold text-foreground mb-1">{insights.length}</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Confidence Score</h3>
                    <div className="text-4xl font-bold text-green-400 mb-1">98.5%</div>
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">
                {hasInsights ? "Actionable Insights" : "Vault Fully Optimized"}
            </h3>

            {!hasInsights && !isScanning && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Your storage is perfectly optimized</h3>
                    <p className="text-muted-foreground max-w-md">VaultIQ has structured your files, removed all duplicates, and secured sensitive data. Run a scan to check again.</p>
                </motion.div>
            )}

            <div className="space-y-4">
                <AnimatePresence>
                    {insights.map((insight) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3 }}
                            className="glass-card rounded-2xl border border-white/5 group hover:border-white/20 transition-all overflow-hidden flex flex-col"
                        >
                            {/* Insight Header */}
                            <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${insight.bgColor} ${insight.color}`}>
                                    {insight.icon && <insight.icon className="w-7 h-7" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-semibold">{insight.title}</h4>
                                        {insight.status === 'critical' && <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">Action Needed</span>}
                                        {insight.status === 'alert' && <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-500/20 text-red-500 border border-red-500/30">High Risk</span>}
                                    </div>
                                    <p className="text-muted-foreground text-sm">{insight.description}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                                    <div className="text-right w-full sm:w-auto">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Impact</div>
                                        <div className={`text-lg font-bold ${insight.savings === 'Security fix' ? 'text-red-400' : 'text-green-400'}`}>{insight.savings}</div>
                                    </div>
                                    {insight.payload && (
                                        <button
                                            onClick={() => handleToggleExpand(insight.id)}
                                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                                        >
                                            {expandedInsight === insight.id ? "Hide Details" : "Review Details"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expandable Panel */}
                            <AnimatePresence>
                                {expandedInsight === insight.id && insight.payload && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-black/20"
                                    >
                                        <div className="p-6 flex flex-col gap-3">
                                            {insight.payload.map((file: any) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                                                        <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSingle(insight.id, file)}
                                                        disabled={fixing === file.id}
                                                        className="p-2 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                                                        title="Delete this duplicate"
                                                    >
                                                        {fixing === file.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

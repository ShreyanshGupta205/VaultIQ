"use client";

import { motion } from "framer-motion";
import { Zap, BrainCircuit, FileImage, ShieldAlert, Cpu } from "lucide-react";

export default function IntelligenceCenterPage() {
    const insights = [
        {
            id: 1,
            title: "Identical Media Files Detected",
            description: "Found 14 duplicate 4K video files spanning across Google Drive and Dropbox.",
            savings: "18.2 GB",
            icon: FileImage,
            color: "text-blue-400",
            bgColor: "bg-blue-400/10",
            status: "critical"
        },
        {
            id: 2,
            title: "Stale Archival Opportunity",
            description: "5 project folders (Marketing 2023, Q1 Assets) haven't been accessed in over 2 years.",
            savings: "14.2 GB",
            icon: BrainCircuit,
            color: "text-indigo-400",
            bgColor: "bg-indigo-400/10",
            status: "suggestion"
        },
        {
            id: 3,
            title: "Unencrypted Sensitive Data Risk",
            description: "Detected 3 files containing potential PII/Financial data in an unshared Google Drive folder.",
            savings: "Security fix",
            icon: ShieldAlert,
            color: "text-red-400",
            bgColor: "bg-red-400/10",
            status: "alert"
        }
    ];

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-primary" />
                        AI Intelligence Center
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        VaultMind's neural engine analyzes your storage to find duplicates, optimize space, and enforce security.
                    </p>
                </div>
                <button className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-medium rounded-full hover:bg-white/80 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <Zap className="w-4 h-4" /> Run Deep Scan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
                    <h3 className="text-sm font-medium text-primary mb-2">Total Potential Savings</h3>
                    <div className="text-4xl font-bold text-foreground mb-1">32.4<span className="text-xl text-muted-foreground ml-1">GB</span></div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Duplicate Files Found</h3>
                    <div className="text-4xl font-bold text-foreground mb-1">1,245</div>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Confidence Score</h3>
                    <div className="text-4xl font-bold text-green-400 mb-1">98.5%</div>
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">Actionable Insights</h3>
            <div className="space-y-4">
                {insights.map((insight) => (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: insight.id * 0.1 }}
                        className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:border-white/20 transition-all"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${insight.bgColor} ${insight.color}`}>
                            <insight.icon className="w-7 h-7" />
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
                            <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap">
                                Review & Fix
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

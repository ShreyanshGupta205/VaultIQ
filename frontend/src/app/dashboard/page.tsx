"use client";

import { motion } from "framer-motion";
import { HardDrive, Search, Shield, Zap, TrendingDown } from "lucide-react";

export default function DashboardOverview() {
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
                    { title: "Total Storage Used", value: "245.8 GB", subtext: "Across 3 providers", icon: HardDrive, color: "text-blue-500" },
                    { title: "Potential Savings", value: "32.4 GB", subtext: "1,245 duplicate files", icon: TrendingDown, color: "text-green-500" },
                    { title: "Files Scanned", value: "84,092", subtext: "Last sync 2 hrs ago", icon: Search, color: "text-indigo-500" },
                    { title: "Security Alerts", value: "0", subtext: "All files encrypted", icon: Shield, color: "text-emerald-500" },
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
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-6">Storage by Provider</h3>
                    <div className="flex-1 flex flex-col justify-center space-y-8">
                        {/* Mock Progress Bars */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1da1f2]" /> Google Drive</span>
                                <span className="text-muted-foreground">120 GB / 200 GB</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1da1f2] w-[60%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0061ff]" /> Dropbox</span>
                                <span className="text-muted-foreground">85 GB / 100 GB</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#0061ff] w-[85%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00a4ef]" /> OneDrive</span>
                                <span className="text-muted-foreground">40.8 GB / 1,000 GB</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00a4ef] w-[4%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        AI Insights
                    </h3>
                    <div className="space-y-4 flex-1">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <h4 className="font-medium text-sm mb-1">Delete duplicate videos</h4>
                            <p className="text-xs text-muted-foreground mb-3">Found 14 duplicate 4K videos across Google Drive and Dropbox.</p>
                            <button className="text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-md border border-primary/50 transition-colors w-full">
                                Review files (18.2 GB)
                            </button>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <h4 className="font-medium text-sm mb-1">Archive unused project files</h4>
                            <p className="text-xs text-muted-foreground mb-3">5 project folders haven't been opened in > 2 years.</p>
                            <button className="text-xs font-semibold text-indigo-400 hover:text-white hover:bg-indigo-500 px-3 py-1.5 rounded-md border border-indigo-500/50 transition-colors w-full">
                                Archive to cold storage (14.2 GB)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

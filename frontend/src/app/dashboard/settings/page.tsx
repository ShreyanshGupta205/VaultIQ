"use client";

import { motion } from "framer-motion";
import { User, Shield, CreditCard, Bell, Key, Monitor } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your account settings, preferences, and workspace configuration.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2 lg:col-span-1">
                    {[
                        { title: "Profile", icon: User, active: true },
                        { title: "Security", icon: Shield, active: false },
                        { title: "Billing & Plans", icon: CreditCard, active: false },
                        { title: "Notifications", icon: Bell, active: false },
                        { title: "API Keys", icon: Key, active: false },
                        { title: "Appearance", icon: Monitor, active: false },
                    ].map((item, i) => (
                        <button
                            key={i}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${item.active
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
                        </button>
                    ))}
                </div>

                {/* Main Settings Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-6 relative overflow-hidden"
                    >
                        <h3 className="text-xl font-bold mb-6">Profile Information</h3>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary relative overflow-hidden group">
                                    <span className="text-2xl font-bold">JD</span>
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-xs font-semibold text-white">Edit</span>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                        <input
                                            type="text"
                                            defaultValue="John"
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Doe"
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue="john.doe@company.com"
                                        className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-muted-foreground"
                                        readOnly
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Contact support to change your email address.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button className="h-10 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                                Save Changes
                            </button>
                        </div>
                    </motion.div>

                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card rounded-2xl p-6 border-destructive/20 relative overflow-hidden"
                    >
                        <h3 className="text-xl font-bold text-destructive mb-2">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-6">Irreversible and destructive actions.</p>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                            <div>
                                <h4 className="font-medium text-sm">Delete Account</h4>
                                <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data.</p>
                            </div>
                            <button className="h-9 px-4 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:bg-destructive/90 transition-colors text-xs">
                                Delete Account
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

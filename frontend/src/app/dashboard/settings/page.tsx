"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, Shield, CreditCard, Bell, Key, Monitor, Lock, Trash2, Palette, Globe, Smartphone } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useRouter } from "next/navigation";

type TabId = "profile" | "security" | "billing" | "notifications" | "apikeys" | "appearance";

export default function SettingsPage() {
    const { user, token, setAuth, logout } = useAuthStore();
    const router = useRouter();

    const [activeTab, setActiveTab ] = useState<TabId>("profile");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Security Form State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        if (!user) {
            fetch("http://localhost:5000/api/auth/me", {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.error) throw new Error(data.error);
                    setAuth(data, token as string);
                    setName(data.name || "");
                })
                .catch(() => {
                    logout();
                    router.push("/login");
                });
        } else {
            setName(user.name as string || "");
        }
    }, [token, user, setAuth, logout, router]);

    const handleSaveProfile = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/user/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setAuth(updatedUser, token);
                alert("Profile updated successfully!");
            }
        } catch (err) {
            alert("Failed to update profile");
        }
        setIsLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!token) return;
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/user/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Password updated successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                alert(data.error || "Failed to update password");
            }
        } catch (err) {
            alert("Failed to update password");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!token) return;
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

        try {
            const res = await fetch("http://localhost:5000/api/user/delete", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                logout();
                router.push("/");
            }
        } catch (err) {
            alert("Failed to delete account");
        }
    };

    if (!user) return <div className="p-8">Loading...</div>;

    const firstName = name.split(" ")[0] || "";
    const lastName = name.split(" ").slice(1).join(" ") || "";
    const initials = (firstName[0] || "") + (lastName[0] || "");

    const sidebarItems = [
        { id: "profile", title: "Profile", icon: UserIcon },
        { id: "security", title: "Security", icon: Shield },
        { id: "billing", title: "Billing & Plans", icon: CreditCard },
        { id: "notifications", title: "Notifications", icon: Bell },
        { id: "apikeys", title: "API Keys", icon: Key },
        { id: "appearance", title: "Appearance", icon: Monitor },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="space-y-6">
                        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                            <h3 className="text-xl font-bold mb-6">Profile Information</h3>
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary relative overflow-hidden group">
                                        <span className="text-2xl font-bold uppercase">{initials || "U"}</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                        <input
                                            type="email"
                                            value={user.email as string}
                                            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-muted-foreground"
                                            readOnly
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Contact support to change your email address.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button onClick={handleSaveProfile} disabled={isLoading} className="h-10 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50">
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-6 border-destructive/20 relative overflow-hidden">
                            <h3 className="text-xl font-bold text-destructive mb-2">Danger Zone</h3>
                            <p className="text-sm text-muted-foreground mb-6">Irreversible and destructive actions.</p>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                                <div>
                                    <h4 className="font-medium text-sm">Delete Account</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data.</p>
                                </div>
                                <button onClick={handleDelete} className="h-9 px-4 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:bg-destructive/90 transition-colors text-xs">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case "security":
                return (
                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden space-y-8">
                        <div>
                            <h3 className="text-xl font-bold">Security Settings</h3>
                            <p className="text-sm text-muted-foreground mt-1">Manage your password and authentication methods.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Lock className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold">Change Password</h4>
                                    <p className="text-xs text-muted-foreground">Regularly update your password for better security.</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <button onClick={handleUpdatePassword} disabled={isLoading} className="mt-2 h-10 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50">
                                    {isLoading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <h4 className="text-sm font-semibold mb-4">Two-Factor Authentication</h4>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 opacity-50 italic">
                                <p className="text-xs text-muted-foreground">Coming soon: Secure your account with mobile app or SMS codes.</p>
                                <div className="h-8 px-4 bg-white/10 text-xs font-semibold rounded-lg flex items-center grayscale">Enable</div>
                            </div>
                        </div>
                    </div>
                );
            case "appearance":
                return (
                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden space-y-8">
                        <div>
                            <h3 className="text-xl font-bold">Appearance</h3>
                            <p className="text-sm text-muted-foreground mt-1">Customize your VaultIQ AI interface.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: "light", title: "Light", icon: Palette },
                                { id: "dark", title: "Dark", icon: Lock },
                                { id: "system", title: "System", icon: Monitor },
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme.id === "dark" 
                                        ? "border-primary bg-primary/10" 
                                        : "border-white/5 bg-white/5 hover:border-white/20"}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <theme.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-semibold">{theme.title}</span>
                                    {theme.id === "dark" && (
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-black" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold">Accent Color</h4>
                            <div className="flex gap-4">
                                {["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((color) => (
                                    <button
                                        key={color}
                                        className="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color, border: color === "#8B5CF6" ? "2px solid white" : "" }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case "billing":
            case "notifications":
            case "apikeys":
                return (
                    <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                            <Monitor className="w-10 h-10 text-primary opacity-50 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Coming Soon</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                We're hard at work building the {activeTab} module. Stay tuned for exciting updates!
                            </p>
                        </div>
                        <button 
                            onClick={() => setActiveTab("profile")}
                            className="text-primary text-sm font-semibold hover:underline"
                        >
                            Return to Profile
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your account settings, preferences, and workspace configuration.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2 lg:col-span-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as TabId);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === item.id
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
                        </button>
                    ))}
                </div>

                {/* Main Content Area with AnimatePresence */}
                <div className="lg:col-span-3 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

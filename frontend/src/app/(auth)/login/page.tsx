"use client";
import React from "react";

import { motion } from "framer-motion";
import { Cloud, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                setIsLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            router.push("/dashboard");
        } catch (err) {
            setError("Network error. Is the backend running?");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden font-[family-name:var(--font-geist-sans)] selection:bg-primary selection:text-white">
            {/* Background gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative"
                >
                    <div className="flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-primary/50 transition-colors">
                                <Cloud className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">VaultMind</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
                    <p className="text-sm text-muted-foreground text-center mb-8">
                        Access your unified intelligent cloud ecosystem.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground">Password</label>
                                <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full h-11 bg-foreground text-background font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group mt-6 disabled:opacity-50">
                            {isLoading ? "Signing In..." : "Sign In"}
                            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="h-px bg-white/10 flex-1" />
                        <span>or continue with</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                        <button 
                            type="button"
                            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google/login`}
                            className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-sm font-medium gap-2">
                            <span className="font-bold">G</span> Continue with Google
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-foreground font-medium hover:underline">
                            Create workspace
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

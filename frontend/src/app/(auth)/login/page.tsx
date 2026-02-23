"use client";

import { motion } from "framer-motion";
import { Cloud, Lock, Mail, ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Temporary redirect to dashboard for functional mockup
        router.push("/dashboard");
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

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
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
                                    placeholder="••••••••••••"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full h-11 bg-foreground text-background font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group mt-6">
                            Sign In
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="h-px bg-white/10 flex-1" />
                        <span>or continue with</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <button className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-sm font-medium gap-2">
                            <Github className="w-4 h-4" /> Github
                        </button>
                        <button className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-sm font-medium gap-2">
                            <span className="font-bold">G</span> Google
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-foreground font-medium hover:underline">
                            Create workspace
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

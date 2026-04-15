"use client";
import React from "react";

import { motion } from "framer-motion";
import { Cloud, Lock, Mail, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const exchangeToken = async (firebaseToken: string, name: string) => {
        const res = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: firebaseToken, name })
        });
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Backend authentication failed");
        }

        setAuth(data.user, data.token);
        router.push("/dashboard");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            await exchangeToken(token, name);
        } catch (err: any) {
            setError(err.message || "Registration failed");
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
                            <span className="text-2xl font-bold tracking-tight">VaultIQ AI</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2">Create Workspace</h2>
                    <p className="text-sm text-muted-foreground text-center mb-8">
                        Start governing your multi-cloud environment securely.
                    </p>

                    <div className="h-14 mb-2 flex items-center justify-center">
                        {error && (
                            <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    <form className="space-y-4" onSubmit={handleRegister}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Jane Doe"
                                    autoComplete="name"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

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
                                    autoComplete="email"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    autoComplete="new-password"
                                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Must be at least 12 characters, including numbers and symbols.</p>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group mt-6 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50">
                            {isLoading ? "Creating Account..." : "Create Account"}
                            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-foreground font-medium hover:underline">
                            Sign In
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-[10px] text-muted-foreground opacity-50">
                        By registering, you agree to VaultIQ AI&apos;s Terms of Service and Privacy Policy. We use zero-trust architectures to ensure we never store your files.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

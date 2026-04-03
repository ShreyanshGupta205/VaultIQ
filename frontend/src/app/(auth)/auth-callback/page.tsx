"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Cloud } from "lucide-react";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams?.get("token");
        const error = searchParams?.get("error");

        if (error) {
            router.push(`/login?error=${error}`);
            return;
        }

        if (token) {
            localStorage.setItem("token", token);
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden font-[family-name:var(--font-geist-sans)] selection:bg-primary selection:text-white">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
                    <Cloud className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-medium tracking-tight">Authenticating...</h2>
            </motion.div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <AuthCallbackContent />
        </Suspense>
    );
}

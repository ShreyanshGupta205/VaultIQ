"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cloud, Shield, Zap, Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Navbar placeholder */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">VaultMind AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#security" className="hover:text-foreground transition-colors">Security</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-40 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium text-primary mb-8 select-none">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            VaultIQ AI Engine v2.0 Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Control All Your Cloud Storage <br className="hidden md:block" />
            <span className="text-gradient">With Intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            One Dashboard. All Your Clouds. Total Control. Securely connect Google Drive, Dropbox, and OneDrive without ever moving a file. Let AI find duplicates, optimize space, and cut costs.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/login" className="group relative px-8 py-4 bg-foreground text-background font-medium rounded-full overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="relative z-10 font-semibold">Launch App Workspace</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 border border-white/10 glass text-foreground font-medium rounded-full hover:bg-white/5 transition-all w-full sm:w-auto">
              View Enterprise Demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-2xl border border-white/10 glass-card overflow-hidden shadow-2xl">
            <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="ml-auto flex items-center gap-3 w-64 px-3 py-1.5 rounded-md bg-black/40 border border-white/5 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                <span className="opacity-50">Search securely across 3 clouds... (⌘K)</span>
              </div>
            </div>
            {/* Mock Dashboard Body */}
            <div className="grid grid-cols-12 h-[450px]">
              {/* Sidebar */}
              <div className="col-span-3 border-r border-white/10 bg-black/20 p-4 space-y-4 hidden md:block">
                <div className="space-y-2">
                  <div className="h-8 rounded-md bg-white/5 border border-white/5 flex items-center px-3" />
                  <div className="h-8 rounded-md bg-white/5 border border-white/5 flex items-center px-3" />
                  <div className="h-8 rounded-md bg-transparent flex items-center px-3" />
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 space-y-2">
                  <div className="h-4 w-24 bg-white/5 rounded" />
                  <div className="h-8 rounded-md bg-transparent flex items-center px-3 gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500/50" />
                    <span className="text-xs text-muted-foreground">Google Drive</span>
                  </div>
                  <div className="h-8 rounded-md bg-transparent flex items-center px-3 gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/50" />
                    <span className="text-xs text-muted-foreground">OneDrive</span>
                  </div>
                </div>
              </div>
              {/* Main Area */}
              <div className="col-span-12 md:col-span-9 p-6 bg-transparent">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1 text-left">
                    <h3 className="text-lg font-semibold text-foreground">AI Storage Optimization</h3>
                    <p className="text-sm text-muted-foreground">23GB potential savings detected today.</p>
                  </div>
                  <button className="px-4 py-2 rounded-md bg-primary/20 text-primary border border-primary/30 text-sm font-medium">Auto-Optimize</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium">Duplicate Files</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">1,245<span className="text-sm text-muted-foreground ml-2 font-normal">files (12.4 GB)</span></div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-yellow-500 w-[60%]" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium">Unused Large Media</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">84<span className="text-sm text-muted-foreground ml-2 font-normal">files (9.2 GB)</span></div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-red-500 w-[40%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

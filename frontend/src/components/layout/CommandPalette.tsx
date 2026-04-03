"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, File, Folder, X, ShieldAlert, Zap, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard listener for Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (!open || !token) return;

        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/files?search=${encodeURIComponent(query)}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.files || []);
                }
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, open, token]);

    const handleSelect = (path?: string) => {
        setOpen(false);
        if (path) router.push(path);
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-2xl bg-black/60 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-card z-10"
                >
                    <div className="flex items-center px-4 py-4 border-b border-white/10">
                        <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-3" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search files, connected clouds, or run AI scans..."
                            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground text-lg"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {loading && (
                            <span className="text-xs text-primary animate-pulse ml-3">Searching...</span>
                        )}
                        <button onClick={() => setOpen(false)} className="ml-3 p-1 rounded-md hover:bg-white/10 text-muted-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {!query && (
                            <div className="p-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Quick Actions</h3>
                                <button onClick={() => handleSelect('/dashboard/intelligence')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium group-hover:text-primary transition-colors">Run Deep Analysis</div>
                                        <div className="text-xs text-muted-foreground">Scan your vault for duplicates and security risks</div>
                                    </div>
                                </button>
                                <button onClick={() => handleSelect('/dashboard/integrations')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Cloud className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium group-hover:text-blue-400 transition-colors">Connect Cloud Provider</div>
                                        <div className="text-xs text-muted-foreground">Link Google Drive, Dropbox, or OneDrive</div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {query && results.length > 0 && (
                            <div className="p-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Files</h3>
                                {results.map((file) => (
                                    <button key={file.id} onClick={() => handleSelect('/dashboard/files')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 text-muted-foreground flex items-center justify-center group-hover:text-foreground">
                                            {file.isDir ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{file.name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{file.connection?.provider}</span>
                                                <span>•</span>
                                                <span>{(Number(file.size) / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {query && results.length === 0 && !loading && (
                            <div className="py-12 text-center text-muted-foreground">
                                No results found for &quot;{query}&quot;
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>Use</span>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[10px]">↑</kbd>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[10px]">↓</kbd>
                            <span>to navigate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Use</span>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[10px]">esc</kbd>
                            <span>to close</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

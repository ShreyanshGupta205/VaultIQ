"use client";

import { FileIcon, FolderIcon, MoreVertical, Search, Filter } from "lucide-react";

export default function FileManagerPage() {
    const dummyFiles = [
        { name: "Q3_Financial_Report_Final.pdf", type: "pdf", size: "4.2 MB", modified: "2 hours ago", cloud: "Google Drive" },
        { name: "Q3_Financial_Report_Final(1).pdf", type: "pdf", size: "4.2 MB", modified: "2 hours ago", cloud: "Dropbox" },
        { name: "Marketing_Assets_2026.zip", type: "zip", size: "1.4 GB", modified: "Yesterday", cloud: "Google Drive" },
        { name: "Product_Roadmap_VaultIQ.pptx", type: "presentation", size: "12.5 MB", modified: "3 days ago", cloud: "OneDrive" },
        { name: "Client_Logos", type: "folder", size: "--", modified: "Last week", cloud: "Google Drive" },
    ];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Unified File Manager</h2>
                    <p className="text-muted-foreground mt-1">Browse, search, and manage files across all clouds instantly.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg bg-black/40 hover:bg-white/5 text-sm font-medium transition-colors">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-primary/90 transition-colors">
                        Upload File
                    </button>
                </div>
            </div>

            <div className="flex-1 glass-card border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto border-b border-white/5">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-black/20 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Cloud Provider</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4">Last Modified</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-foreground">
                            {dummyFiles.map((file, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        {file.type === "folder" ? (
                                            <FolderIcon className="w-5 h-5 text-indigo-400" />
                                        ) : (
                                            <FileIcon className="w-5 h-5 text-blue-400" />
                                        )}
                                        <span className="font-medium group-hover:text-primary transition-colors">{file.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 border border-white/10">
                                            {file.cloud}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{file.modified}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground group-hover:text-foreground">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-muted-foreground flex justify-between items-center">
                    <span>Showing 5 of 84,092 files</span>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10">Prev</button>
                        <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

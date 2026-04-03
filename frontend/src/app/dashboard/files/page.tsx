"use client";

import { useState, useEffect, useRef } from "react";
import { FileIcon, FolderIcon, MoreVertical, Filter, Image as ImageIcon, Video, FileText, File as GenericFile, Trash2 } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { API_BASE_URL } from "@/lib/constants";

function formatBytes(bytes: string | number) {
    if (!bytes) return "0 B";
    const b = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
    return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function getFileIcon(mimeType: string, isDir: boolean) {
    if (isDir) return <FolderIcon className="w-5 h-5 text-indigo-400" />;
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-pink-400" />;
    if (mimeType.includes("pdf") || mimeType.includes("document")) return <FileText className="w-5 h-5 text-blue-400" />;
    return <GenericFile className="w-5 h-5 text-muted-foreground" />;
}

export default function FileManagerPage() {
    const { token } = useAuthStore();
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/files`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
            }
        } catch (err) {
            console.error("Failed to fetch files", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchFiles();
    }, [token]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !token) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                await fetchFiles();
            } else {
                const error = await res.json();
                alert(error.error || "Upload failed");
            }
        } catch (err) {
            console.error("Upload error", err);
            alert("Network error during upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm("Are you sure you want to logically delete this file from VaultIQ and move it to the Cloud Trash?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setFiles(prev => prev.filter(f => f.id !== fileId));
            } else {
                const error = await res.json();
                alert(error.error || "Delete failed");
            }
        } catch (err) {
            console.error("Delete error", err);
            alert("Network error");
        }
    };

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
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? "Uploading..." : "Upload File"}
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Loading files...
                                    </td>
                                </tr>
                            ) : files.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No files found. Try connecting a cloud account.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr 
                                        key={file.id} 
                                        onClick={() => { if(file.webViewLink) window.open(file.webViewLink, '_blank'); }}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {getFileIcon(file.mimeType, file.isDir)}
                                            <span className="font-medium group-hover:text-primary transition-colors">{file.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 border border-white/10">
                                                {file.connection?.provider === "GOOGLE_DRIVE" ? "Google Drive" : file.connection?.provider === "DROPBOX" ? "Dropbox" : "OneDrive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatBytes(file.size)}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(file.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end items-center gap-1">
                                            <button 
                                                className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-red-400 group-hover:text-red-400/70 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                                title="Delete File"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground group-hover:text-foreground transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-muted-foreground flex justify-between items-center">
                    <span>Showing {files.length} files</span>
                    {files.length > 0 && (
                        <div className="flex gap-2">
                            <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10" disabled>PREVIOUS</button>
                            <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10" disabled>NEXT</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

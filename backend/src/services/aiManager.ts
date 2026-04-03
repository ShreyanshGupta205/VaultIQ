import prisma from '../lib/prisma';

export async function runStorageAnalysis(userId: string, reportId: string) {
    console.log(`[aiManager] Starting storage analysis for user ${userId}...`);

    try {
        const files = await prisma.cloudFile.findMany({
            where: { userId },
        });

        const totalFiles = files.length;
        let totalSize = BigInt(0);
        let duplicatesSize = BigInt(0);
        let unusedSize = BigInt(0);

        // Grouping for duplicates detection
        // Keys: name_size (Simple heuristic)
        // MD5 Checksum is more accurate and we have it from Google Drive sync
        const dupMap = new Map<string, any[]>();
        const staleDate = new Date();
        staleDate.setMonth(staleDate.getMonth() - 3);

        const duplicates: any[] = [];

        for (const file of files) {
            totalSize += file.size;

            // Stale detection (older than 3 months)
            if (new Date(file.updatedAt) < staleDate) {
                unusedSize += file.size;
            }

            // Duplicate detection using MD5 if available, otherwise name+size
            const key = file.md5Checksum || `${file.name}_${file.size}`;
            if (!dupMap.has(key)) {
                dupMap.set(key, [file]);
            } else {
                dupMap.get(key)!.push(file);
            }
        }

        // Process duplicates
        for (const [key, group] of dupMap.entries()) {
            if (group.length > 1) {
                // All but the first are duplicates
                const first = group[0];
                const dupsInGroup = group.slice(1);
                
                for (const d of dupsInGroup) {
                    duplicatesSize += d.size;
                    duplicates.push({
                        id: d.id,
                        name: d.name,
                        size: d.size.toString(),
                        fileId: d.fileId
                    });
                }
            }
        }

        // Update the report in DB
        await prisma.analysisReport.update({
            where: { id: reportId },
            data: {
                status: 'COMPLETED',
                totalFiles,
                totalSize,
                duplicatesSize,
                unusedSize,
                data: JSON.stringify({ duplicates })
            }
        });

        console.log(`[aiManager] Successfully completed analysis for user ${userId}. Found ${duplicates.length} duplicates.`);

    } catch (err: any) {
        console.error(`[aiManager] Error during analysis:`, err?.message || err);
        await prisma.analysisReport.update({
            where: { id: reportId },
            data: { status: 'ERROR' }
        });
    }
}

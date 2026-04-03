import prisma from './prisma';

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

        const dupMap = new Map<string, any[]>();
        const staleDate = new Date();
        staleDate.setMonth(staleDate.getMonth() - 3);

        const duplicates: any[] = [];

        for (const file of files) {
            totalSize += file.size;

            if (new Date(file.updatedAt) < staleDate) {
                unusedSize += file.size;
            }

            const key = file.md5Checksum || `${file.name}_${file.size}`;
            if (!dupMap.has(key)) {
                dupMap.set(key, [file]);
            } else {
                dupMap.get(key)!.push(file);
            }
        }

        for (const [key, group] of Array.from(dupMap.entries())) {
            if (group.length > 1) {
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

        console.log(`[aiManager] Completed analysis for user ${userId}. Found ${duplicates.length} duplicates.`);

    } catch (err: any) {
        console.error(`[aiManager] Error during analysis:`, err?.message || err);
        await prisma.analysisReport.update({
            where: { id: reportId },
            data: { status: 'ERROR' }
        });
    }
}

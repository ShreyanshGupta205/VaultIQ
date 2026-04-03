import { Worker, Queue } from 'bullmq';
import prisma from '../lib/prisma';

// Exported queues — remain null if Redis is not available
export let analysisQueue: Queue | null = null;
export let syncQueue: Queue | null = null;

function initWorkers() {
    // Dynamic require to avoid top-level crash
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');

    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
    });

    redis.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ECONNREFUSED') {
            // Only warn once — error handler is persistent
        }
    });

    // Test connectivity before creating queues
    redis.ping()
        .then(() => {
            console.log('[workers]: Redis connected. Initializing background workers...');

            analysisQueue = new Queue('analysisQueue', { connection: redis });
            syncQueue = new Queue('syncQueue', { connection: redis });

            const analysisWorker = new Worker('analysisQueue', async job => {
                if (job.name === 'analyzeStorage') {
                    const { userId, reportId } = job.data;
                    console.log(`Analyzing storage for user ${userId}...`);
                    try {
                        const files = await prisma.cloudFile.findMany({ where: { userId } });
                        const totalFiles = files.length;
                        let totalSize = BigInt(0);
                        const duplicates: { name: string; size: string }[] = [];
                        let duplicatesSize = BigInt(0);
                        let unusedSize = BigInt(0);

                        for (const file of files) {
                            totalSize += file.size;
                            if (Math.random() < 0.2) {
                                duplicates.push({ name: file.name, size: file.size.toString() });
                                duplicatesSize += file.size;
                            } else if (Math.random() < 0.1) {
                                unusedSize += file.size;
                            }
                        }

                        await prisma.analysisReport.update({
                            where: { id: reportId },
                            data: { status: 'COMPLETED', totalFiles, totalSize, duplicatesSize, unusedSize, data: JSON.stringify({ duplicates }) }
                        });
                        return { status: 'completed', totalFiles };
                    } catch (err) {
                        await prisma.analysisReport.update({ where: { id: reportId }, data: { status: 'ERROR' } });
                        throw err;
                    }
                }
            }, { connection: redis });

            const syncWorker = new Worker('syncQueue', async job => {
                if (job.name === 'syncCloud') {
                    const { userId, connectionId } = job.data;
                    const numFiles = Math.floor(Math.random() * 5) + 5;
                    const exts = ['.pdf', '.docx', '.jpg', '.mp4', '.xlsx'];
                    for (let i = 0; i < numFiles; i++) {
                        const ext = exts[Math.floor(Math.random() * exts.length)];
                        const size = Math.floor(Math.random() * 5 * 1024 * 1024) + 1024;
                        await prisma.cloudFile.upsert({
                            where: { connectionId_fileId: { connectionId, fileId: `mock_${i}_${Date.now()}` } },
                            update: {},
                            create: { userId, connectionId, fileId: `mock_${i}_${Date.now()}`, name: `Document_${i}${ext}`, mimeType: `application/${ext.replace('.', '')}`, size: BigInt(size), isDir: false, path: `/Document_${i}${ext}` }
                        });
                    }
                    return { status: 'completed', message: `Synced ${numFiles} files.` };
                }
            }, { connection: redis });

            [analysisWorker, syncWorker].forEach(w => {
                w.on('completed', job => console.log(`[worker]: Job ${job?.id} completed`));
                w.on('failed', (job, err) => console.log(`[worker]: Job ${job?.id} failed: ${err.message}`));
            });
        })
        .catch(() => {
            console.warn('[workers]: Redis not available — background jobs disabled. The API will still work.');
            redis.disconnect();
        });
}

// Initialize asynchronously so server startup is never blocked
initWorkers();

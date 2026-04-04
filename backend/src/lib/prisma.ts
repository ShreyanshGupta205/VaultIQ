import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.fnqppnujnaopidfrxqjp:63897Student%402005@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    },
  },
});

export default prisma;

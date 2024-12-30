import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
export * from '@prisma/client';
export * from './types';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

const prisma = global.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma; 
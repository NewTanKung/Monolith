import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getOrCreatePrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Lazy Proxy: instantiates PrismaClient upon first access to prevent module-load crash
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getOrCreatePrismaInstance() as any;
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

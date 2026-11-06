import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: any };

function getOrCreatePrismaInstance(): any {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  try {
    const client = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (err) {
    console.warn("PrismaClient could not be initialized:", err);
    return null;
  }
}

// Lazy Proxy: prevents top-level module evaluation crash if prisma generate has not been run
export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getOrCreatePrismaInstance();
      if (!instance) {
        throw new Error(
          "@prisma/client is not initialized. Please run 'npx prisma generate' or check database configuration."
        );
      }
      const value = instance[prop];
      if (typeof value === "function") {
        return value.bind(instance);
      }
      return value;
    },
  }
);

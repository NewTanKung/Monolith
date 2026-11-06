import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let productionClient: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return (productionClient ??= new PrismaClient());
  }
  return (globalForPrisma.prisma ??= new PrismaClient());
}

// Keep construction lazy so builds do not need a running database.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

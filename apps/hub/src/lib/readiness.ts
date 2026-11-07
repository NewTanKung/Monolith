import { prisma } from "./prisma";
import { mailConfiguration } from "./mail";
import { hubDomainReady } from "./domains";
export async function readiness() {
  let database = false,
    email = false;
  try {
    await prisma.hubSettings.count();
    await prisma.session.count();
    database = true;
  } catch {
    /* Status only; no driver error or connection string. */
  }
  try {
    mailConfiguration();
    email = true;
  } catch {
    /* Configuration only, not a delivery test. */
  }
  const domain = hubDomainReady();
  return { ok: database && email && domain, database, email, domain };
}

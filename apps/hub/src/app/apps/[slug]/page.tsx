import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hasRequiredRole } from "@monolith/auth-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconRenderer } from "@/components/common/IconRenderer";
export const dynamic = "force-dynamic";
export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, app] = await Promise.all([
    getCurrentUser(),
    prisma.appItem.findUnique({ where: { slug } }),
  ]);
  if (
    !app ||
    app.status === "DISABLED" ||
    !hasRequiredRole(user?.role, app.minRole)
  )
    notFound();
  const maintenance = app.status === "MAINTENANCE";
  return (
    <main id="main-content" className="mx-auto min-h-dvh max-w-4xl px-5 py-16">
      <Link href="/" className="text-sm text-zinc-400">
        ← กลับหน้า Monolith Hub
      </Link>
      <section className="mt-8 rounded-3xl liquid-glass p-8 sm:p-12 space-y-6">
        <div
          className={
            "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br " +
            app.color
          }
        >
          <IconRenderer name={app.icon} className="h-8 w-8" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-300">
            {app.category} / {app.status}
          </p>
          <h1 className="mt-2 text-3xl font-bold break-words">{app.name}</h1>
          <p className="mt-3 text-zinc-400 break-words">{app.description}</p>
        </div>
        {maintenance ? (
          <p
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200"
          >
            บริการนี้อยู่ระหว่างปรับปรุง กรุณากลับมาอีกครั้งภายหลัง
          </p>
        ) : (
          <p className="text-sm text-zinc-400">
            บริการนี้อยู่ในทะเบียน Monolith ของคุณ
          </p>
        )}
        {!maintenance && !app.url.includes("/apps/" + app.slug) && (
          <a
            href={"/apps/" + app.slug + "/launch"}
            className="inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold"
          >
            เปิดบริการ ↗
          </a>
        )}
      </section>
    </main>
  );
}

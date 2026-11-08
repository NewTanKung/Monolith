import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hasRequiredRole } from "@monolith/auth-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconRenderer } from "@/components/common/IconRenderer";
import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
import { categoryLabels, statusLabels } from "@/lib/display";
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
    <>
      <WorkspaceHeader label="รายละเอียดบริการ" />
      <main id="main-content" className="mx-auto w-full max-w-2xl px-5 py-10">
        <section className="surface-panel space-y-6">
          <div
            className={
              "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br " +
              app.color
            }
          >
            <IconRenderer name={app.icon} className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-muted">
              {categoryLabels[app.category]} · {statusLabels[app.status]}
            </p>
            <h1 className="mt-2 text-3xl font-bold break-words">{app.name}</h1>
            <p className="mt-3 text-muted break-words">{app.description}</p>
          </div>
          {maintenance ? (
            <p role="status" className="help-panel">
              บริการนี้อยู่ระหว่างปรับปรุง กรุณากลับมาอีกครั้งภายหลัง
            </p>
          ) : (
            <p className="text-sm text-muted">
              บริการนี้อยู่ในทะเบียน Monolith ของคุณ
            </p>
          )}
          {!maintenance && !app.url.includes("/apps/" + app.slug) && (
            <a
              href={"/apps/" + app.slug + "/launch"}
              className="primary-button"
            >
              เปิดบริการ ↗
            </a>
          )}
        </section>
        <Link href="/" className="back-link mt-5">
          กลับหน้า Monolith Hub
        </Link>
      </main>
    </>
  );
}

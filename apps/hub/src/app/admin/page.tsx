import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
export const revalidate = 0;
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN")
    return (
      <>
        <WorkspaceHeader />
        <main id="main-content" className="account-shell">
          <section className="account-panel">
            <h1 className="text-xl font-semibold">หน้านี้สำหรับผู้ดูแลระบบ</h1>
            <Link href="/" className="primary-button mt-5">
              กลับหน้า Hub
            </Link>
          </section>
        </main>
      </>
    );
  const apps = await prisma.appItem.findMany({
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
  return (
    <>
      <WorkspaceHeader label="ผู้ดูแลระบบ" />
      <main id="main-content">
        <AdminConsole
          hubUrl={process.env.HUB_URL || ""}
          apps={apps.map(
            ({ createdAt: _created, updatedAt: _updated, ...app }) => app,
          )}
        />
      </main>
    </>
  );
}

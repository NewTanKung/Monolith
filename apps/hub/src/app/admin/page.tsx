import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminConsole } from "@/components/admin/AdminConsole";
export const revalidate = 0;
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN")
    return (
      <main id="main-content" className="account-shell">
        <section className="account-panel liquid-glass">
          <h1 className="text-xl font-semibold">หน้านี้สำหรับผู้ดูแลระบบ</h1>
          <Link href="/" className="mt-5 inline-block text-teal-200">
            กลับหน้า Hub
          </Link>
        </section>
      </main>
    );
  const apps = await prisma.appItem.findMany({
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8"
    >
      <header className="mb-8 border-b border-white/10 pb-6">
        <Link href="/" className="text-sm text-teal-200">
          ← กลับหน้า Hub
        </Link>
        <h1 className="mt-5 text-2xl font-semibold">จัดการ Monolith</h1>
        <p className="mt-2 text-sm text-zinc-400">
          บริการ สมาชิก และการเชื่อมต่อ · {user.name || user.email}
        </p>
      </header>
      <AdminConsole
        apps={apps.map(
          ({ createdAt: _created, updatedAt: _updated, ...app }) => app,
        )}
      />
    </main>
  );
}

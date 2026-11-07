import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AccountManager } from "@/components/account/AccountManager";
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link href="/" className="text-sm text-teal-200">
        ← กลับหน้า Hub
      </Link>
      <h1 className="mb-8 mt-6 text-2xl font-semibold">บัญชีและความปลอดภัย</h1>
      <AccountManager user={user} />
    </main>
  );
}

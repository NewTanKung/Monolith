import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AccountManager } from "@/components/account/AccountManager";
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <WorkspaceHeader label="บัญชีของคุณ" />
      <main id="main-content">
        <AccountManager user={user} />
      </main>
    </>
  );
}

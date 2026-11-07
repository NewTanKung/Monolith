import { AuthForm } from "@/components/account/AuthForm";
import { safeReturnTo } from "@/lib/services";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const service = typeof query.service === "string" ? query.service : null;
  const target = await safeReturnTo(
    service,
    typeof query.returnTo === "string" ? query.returnTo : null,
  );
  const continueUrl =
    target === "/"
      ? "/"
      : "/auth/continue?" +
        new URLSearchParams({ service: service!, returnTo: target }).toString();
  return <AuthForm mode="login" continueUrl={continueUrl} />;
}

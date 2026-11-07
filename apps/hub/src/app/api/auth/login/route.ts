import { accountPost } from "@/lib/accounts";
export async function POST(req: Request) {
  return accountPost(req, "login");
}

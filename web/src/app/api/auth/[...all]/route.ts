import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const handler = async (req: Request) => {
  return auth.handler(req);
};

export { handler as GET, handler as POST };
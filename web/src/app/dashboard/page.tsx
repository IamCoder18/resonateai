import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Dashboard } from "@/components/dashboard";
import { isAdminEmail } from "@/lib/admin";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  if (isAdminEmail(session.user.email)) {
    return <AdminDashboard user={session.user} />;
  }
  return <Dashboard user={session.user} />;
}
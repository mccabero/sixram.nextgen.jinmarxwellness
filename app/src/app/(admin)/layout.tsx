import { AdminShell } from "@/components/layout/AdminShell";
import { requireServerSession } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerSession();

  return <AdminShell>{children}</AdminShell>;
}

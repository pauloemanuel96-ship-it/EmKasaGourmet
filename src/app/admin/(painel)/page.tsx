import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/dashboard";
import { AdminPage } from "@/components/admin/page-shell";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <AdminPage>
      <Dashboard />
    </AdminPage>
  );
}

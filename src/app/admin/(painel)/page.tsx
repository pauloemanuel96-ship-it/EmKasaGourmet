import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/dashboard";
import { AdminPage } from "@/components/admin/page-shell";
import { TrafficPulse } from "@/components/admin/trafego/pulse";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <AdminPage>
      <TrafficPulse />
      <Dashboard />
    </AdminPage>
  );
}

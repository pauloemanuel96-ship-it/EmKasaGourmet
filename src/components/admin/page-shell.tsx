import { Suspense } from "react";
import { StaffGate } from "./staff-gate";
import type { StaffRole } from "@/modules/auth/staff";

export function AdminPage({
  roles,
  children,
}: {
  roles?: StaffRole[];
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-ink-600">Carregando…</p>}>
      <StaffGate roles={roles}>{children}</StaffGate>
    </Suspense>
  );
}

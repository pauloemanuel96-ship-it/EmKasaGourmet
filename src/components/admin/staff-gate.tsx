import { signOut } from "@/modules/auth/actions";
import { requireStaff, type StaffRole } from "@/modules/auth/staff";

/** Checagem de papel no servidor, por página (não confiar só no layout). */
export async function StaffGate({
  roles,
  children,
}: {
  roles?: StaffRole[];
  children: React.ReactNode;
}) {
  const access = await requireStaff(roles);
  if (!access.allowed) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl">Sem acesso</h1>
        <p className="text-ink-600">
          {access.user.email ?? "Esta conta"} não tem permissão para esta área.
          Peça a liberação para a administração.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-4 font-medium"
          >
            Sair
          </button>
        </form>
      </section>
    );
  }
  return <>{children}</>;
}

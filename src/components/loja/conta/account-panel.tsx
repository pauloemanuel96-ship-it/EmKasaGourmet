import Link from "next/link";
import { signOutCustomer } from "@/modules/conta/actions";
import { getCustomerAccount } from "@/modules/conta/queries";
import { getHousehold } from "@/modules/familia/queries";
import { AddressManager } from "./address-manager";
import { FamilyManager } from "./family-manager";
import { BTN_GHOST } from "./fields";
import { ProfileForm } from "./profile-form";

/**
 * Conta de verdade no topo da Minha Casa (D-042): dados e endereços salvos no
 * banco. Sem login, vira o convite para entrar ou criar conta.
 */
export async function AccountPanel() {
  const account = await getCustomerAccount();

  if (!account) {
    return (
      <section className="bg-forest-900 text-cream-50 mb-10 flex flex-col gap-4 rounded-(--radius-media) p-6 sm:p-8">
        <h2 className="text-cream-50 text-3xl">Entre na sua conta</h2>
        <p className="text-cream-50/85 max-w-prose">
          Guarde seus dados e os endereços da família para comprar mais rápido e
          receber descontos.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/entrar"
            className="bg-cream-50 text-forest-900 inline-flex min-h-12 items-center rounded-full px-6 font-medium"
          >
            Entrar
          </Link>
          <Link
            href="/entrar?criar=1"
            className="border-cream-50/60 text-cream-50 inline-flex min-h-12 items-center rounded-full border px-6 font-medium"
          >
            Criar conta
          </Link>
        </div>
      </section>
    );
  }

  const household = await getHousehold();

  return (
    <div className="mb-12 flex flex-col gap-10">
      <section aria-labelledby="conta-dados" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="conta-dados" className="text-3xl">
              Olá, {account.name.split(" ")[0]}
            </h2>
            <p className="text-ink-600 text-sm break-all">{account.email}</p>
          </div>
          <form action={signOutCustomer}>
            <button type="submit" className={BTN_GHOST}>
              Sair
            </button>
          </form>
        </div>
        <ProfileForm
          name={account.name}
          phone={account.phone}
          marketing={account.marketing_consent}
        />
      </section>

      <section aria-labelledby="conta-familia" className="flex flex-col gap-4">
        <div>
          <h2 id="conta-familia" className="text-3xl">
            Quem mora com você
          </h2>
          <p className="text-ink-600">
            Cada pessoa com o que gosta, o que evita e o que não pode comer.
          </p>
        </div>
        <FamilyManager household={household} />
      </section>

      <section
        aria-labelledby="conta-enderecos"
        className="flex flex-col gap-4"
      >
        <div>
          <h2 id="conta-enderecos" className="text-3xl">
            Endereços da família
          </h2>
          <p className="text-ink-600">
            Casa, trabalho, casa dos pais ou dos filhos. Na hora da compra você
            escolhe para onde vai.
          </p>
        </div>
        <AddressManager addresses={account.addresses} />
      </section>
      <p>
        <Link
          href="/minha-casa/senha"
          className="text-ink-600 text-sm underline underline-offset-4"
        >
          Trocar a senha
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  deleteAddress,
  makeDefaultAddress,
  saveAddress,
} from "@/modules/conta/actions";
import type { CustomerAddress } from "@/modules/conta/queries";
import { formatCep, UF, type FormState } from "@/modules/conta/schemas";
import { BTN_GHOST, BTN_PRIMARY, Field, FormMessage, INPUT } from "./fields";

const IDLE: FormState = { status: "idle" };
const SUGGESTED = [
  "Casa",
  "Trabalho",
  "Casa da mãe",
  "Casa do pai",
  "Casa do filho",
];

/**
 * Endereços da conta (D-042): vários por pessoa, cada um com um nome, pensando
 * na família. O CEP preenche rua, bairro e cidade; a pessoa confere e ajusta.
 */
export function AddressManager({
  addresses,
}: {
  addresses: CustomerAddress[];
}) {
  const [editing, setEditing] = useState<CustomerAddress | "novo" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && editing === null && (
        <p className="text-ink-600">
          Nenhum endereço cadastrado. Cadastre o de casa, o do trabalho ou o de
          alguém da família.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="border-sand-200 bg-paper flex flex-col gap-2 rounded-(--radius-media) border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-forest-900 font-serif text-xl">{a.label}</p>
              {a.is_default && (
                <span className="bg-leaf-700 text-cream-50 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Principal
                </span>
              )}
            </div>
            <p className="text-ink-600 text-sm">
              {a.recipient ? `${a.recipient} · ` : ""}
              {a.street}, {a.number}
              {a.complement ? `, ${a.complement}` : ""}
              <br />
              {a.district} · {a.city}/{a.state} · CEP {formatCep(a.cep)}
              {a.reference ? (
                <>
                  <br />
                  Referência: {a.reference}
                </>
              ) : null}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing(a)}
                className={BTN_GHOST}
              >
                Alterar
              </button>
              {!a.is_default && (
                <form action={makeDefaultAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className={BTN_GHOST}>
                    Tornar principal
                  </button>
                </form>
              )}
              <details className="text-sm">
                <summary className="text-ink-600 flex min-h-11 cursor-pointer items-center px-2 underline">
                  Apagar
                </summary>
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="bg-terracotta-500 min-h-10 rounded-full px-4 font-medium text-white"
                  >
                    Apagar este endereço
                  </button>
                </form>
              </details>
            </div>
          </li>
        ))}
      </ul>

      {editing === null ? (
        addresses.length < 10 && (
          <div>
            <button
              type="button"
              onClick={() => setEditing("novo")}
              className={BTN_PRIMARY}
            >
              Cadastrar endereço
            </button>
          </div>
        )
      ) : (
        <AddressForm
          key={editing === "novo" ? "novo" : editing.id}
          address={editing === "novo" ? null : editing}
          first={addresses.length === 0}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AddressForm({
  address,
  first,
  onDone,
}: {
  address: CustomerAddress | null;
  first: boolean;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveAddress, IDLE);
  const [cepNote, setCepNote] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") onDone();
  }, [state.status, onDone]);

  // CEP -> rua, bairro, cidade e estado (ViaCEP). Se falhar, a pessoa digita.
  async function lookup(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepNote("Buscando o CEP…");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        erro?: boolean | string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!res.ok || data.erro) {
        setCepNote("CEP não encontrado. Preencha o endereço à mão.");
        return;
      }
      const form = formRef.current;
      if (!form) return;
      const set = (name: string, value?: string) => {
        const el = form.elements.namedItem(name) as HTMLInputElement | null;
        if (el && value) el.value = value;
      };
      set("street", data.logradouro);
      set("district", data.bairro);
      set("city", data.localidade);
      set("state", data.uf);
      setCepNote("Endereço preenchido pelo CEP. Confira e ajuste se precisar.");
      (form.elements.namedItem("number") as HTMLInputElement | null)?.focus();
    } catch {
      setCepNote("Não deu para buscar o CEP. Preencha o endereço à mão.");
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="border-sand-200 bg-paper grid gap-4 rounded-(--radius-media) border p-5 sm:grid-cols-6"
    >
      <h3 className="text-2xl sm:col-span-6">
        {address ? `Alterar “${address.label}”` : "Novo endereço"}
      </h3>
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-3">
        <Field
          label="Nome deste endereço"
          name="label"
          defaultValue={address?.label ?? ""}
          list="nomes-de-endereco"
          placeholder="Casa, Trabalho, Casa da mãe…"
          required
          state={state}
        />
        <datalist id="nomes-de-endereco">
          {SUGGESTED.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <Field
        className="sm:col-span-3"
        label="Quem recebe (opcional)"
        name="recipient"
        defaultValue={address?.recipient ?? ""}
        state={state}
      />
      <div className="sm:col-span-2">
        <Field
          label="CEP"
          name="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          defaultValue={address ? formatCep(address.cep) : ""}
          onBlur={(e) => lookup(e.target.value)}
          required
          state={state}
        />
        {cepNote && (
          <p role="status" className="text-ink-600 mt-1 text-xs">
            {cepNote}
          </p>
        )}
      </div>
      <Field
        className="sm:col-span-4"
        label="Rua"
        name="street"
        defaultValue={address?.street ?? ""}
        autoComplete="address-line1"
        required
        state={state}
      />
      <Field
        className="sm:col-span-2"
        label="Número"
        name="number"
        defaultValue={address?.number ?? ""}
        required
        state={state}
      />
      <Field
        className="sm:col-span-4"
        label="Complemento (opcional)"
        name="complement"
        defaultValue={address?.complement ?? ""}
        state={state}
      />
      <Field
        className="sm:col-span-2"
        label="Bairro"
        name="district"
        defaultValue={address?.district ?? ""}
        required
        state={state}
      />
      <Field
        className="sm:col-span-3"
        label="Cidade"
        name="city"
        defaultValue={address?.city ?? ""}
        autoComplete="address-level2"
        required
        state={state}
      />
      <div className="sm:col-span-1">
        <label
          htmlFor="campo-state"
          className="text-ink-900 mb-1 block text-sm font-medium"
        >
          Estado
        </label>
        <select
          id="campo-state"
          name="state"
          defaultValue={
            (state.status === "error" ? state.values?.state : undefined) ??
            address?.state ??
            ""
          }
          required
          className={INPUT}
        >
          <option value="" disabled>
            UF
          </option>
          {UF.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </div>
      <Field
        className="sm:col-span-6"
        label="Ponto de referência (opcional)"
        name="reference"
        defaultValue={address?.reference ?? ""}
        state={state}
      />
      {!first && !address?.is_default && (
        <label className="text-ink-600 flex items-center gap-3 text-sm sm:col-span-6">
          <input
            type="checkbox"
            name="isDefault"
            className="accent-forest-900 size-5"
          />
          Usar como endereço principal
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Salvando…" : "Salvar endereço"}
        </button>
        <button type="button" onClick={onDone} className={BTN_GHOST}>
          Cancelar
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

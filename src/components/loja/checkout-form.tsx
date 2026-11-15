"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DELIVERY_ZONES } from "@/demo/data";
import { nextDeliveryDates } from "@/demo/logic";
import { cartLines, demo, useDemo } from "@/demo/store";
import { formatCents } from "@/lib/money";

export function CheckoutForm() {
  const router = useRouter();
  const lines = useDemo(cartLines);
  const blocked = useDemo((s) => s.blockedDates);
  const points = useDemo((s) => s.points);
  const [zoneId, setZoneId] = useState(DELIVERY_ZONES[0].id);
  const [date, setDate] = useState("");
  const [payment, setPayment] = useState<"pix" | "cartao">("pix");
  const [usePoints, setUsePoints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const zone = DELIVERY_ZONES.find((z) => z.id === zoneId)!;
  const dates = useMemo(
    () => nextDeliveryDates(zone, new Date(), blocked),
    [zone, blocked],
  );
  const subtotal = lines.reduce((t, l) => t + l.priceCents * l.quantity, 0);
  const discount = usePoints && points >= 250 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + zone.feeCents - discount;

  if (lines.length === 0) {
    return (
      <p className="text-ink-600 mt-8">
        Carrinho vazio.{" "}
        <Link href="/loja" className="underline">
          Voltar à loja
        </Link>
      </p>
    );
  }

  function submit(form: FormData) {
    setError(null);
    const name = String(form.get("nome") ?? "").trim();
    const phone = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
    if (name.length < 2) return setError("Informe seu nome.");
    if (phone.length < 10) return setError("Informe um WhatsApp com DDD.");
    if (!date) return setError("Escolha a data de entrega.");
    setPaying(true);
    // Simula o tempo de confirmação do pagamento
    setTimeout(() => {
      const r = demo.placeOrder({
        name,
        phone,
        zoneId,
        deliveryDate: date,
        payment,
        usePoints,
      });
      setPaying(false);
      if (!r.ok) return setError(r.message);
      router.push(`/pedido/${r.number}`);
    }, 900);
  }

  return (
    <form action={submit} className="mt-8 grid gap-10 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="text-forest-900 mb-2 font-serif text-xl">
            Seus dados
          </legend>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nome
            <input
              name="nome"
              autoComplete="name"
              className="border-ink-600/30 min-h-11 rounded-(--radius-control) border bg-white px-3 text-base font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            WhatsApp
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(79) 9 9999-9999"
              className="border-ink-600/30 min-h-11 rounded-(--radius-control) border bg-white px-3 text-base font-normal"
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-forest-900 mb-2 font-serif text-xl">
            Entrega
          </legend>
          {DELIVERY_ZONES.map((z) => (
            <label
              key={z.id}
              className="border-sand-200 flex min-h-11 items-center justify-between gap-3 rounded-(--radius-control) border bg-white px-4 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="zona"
                  checked={zoneId === z.id}
                  onChange={() => {
                    setZoneId(z.id);
                    setDate("");
                  }}
                />
                {z.name}
              </span>
              <span className="text-ink-600">
                {z.feeCents === 0 ? "Grátis" : formatCents(z.feeCents)}
              </span>
            </label>
          ))}
          <p className="mt-2 text-sm font-medium">Data</p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d.iso}
                type="button"
                aria-pressed={date === d.iso}
                onClick={() => setDate(d.iso)}
                className="border-forest-900/40 aria-pressed:bg-forest-900 aria-pressed:text-cream-50 min-h-11 rounded-(--radius-control) border px-4 text-sm"
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-forest-900 mb-2 font-serif text-xl">
            Pagamento <span className="text-ink-600 text-sm">(simulado)</span>
          </legend>
          {(["pix", "cartao"] as const).map((m) => (
            <label
              key={m}
              className="border-sand-200 flex min-h-11 items-center gap-2 rounded-(--radius-control) border bg-white px-4 text-sm"
            >
              <input
                type="radio"
                name="pagamento"
                checked={payment === m}
                onChange={() => setPayment(m)}
              />
              {m === "pix" ? "Pix" : "Cartão de crédito"}{" "}
              <span className="text-ink-600">
                via Mercado Pago (na versão real)
              </span>
            </label>
          ))}
          {points >= 250 && (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
              />
              Usar 250 pontos do Clube: 10% de desconto
            </label>
          )}
        </fieldset>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-(--radius-media) bg-white p-5 text-sm md:sticky md:top-24">
        <p className="text-forest-900 font-serif text-xl">Resumo</p>
        <ul className="flex flex-col gap-1">
          {lines.map((l) => (
            <li key={l.slug} className="flex justify-between gap-2">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span>{formatCents(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-sand-200 flex justify-between border-t pt-2">
          <span>Entrega</span>
          <span>
            {zone.feeCents === 0 ? "Grátis" : formatCents(zone.feeCents)}
          </span>
        </div>
        {discount > 0 && (
          <div className="text-leaf-500 flex justify-between">
            <span>Clube</span>
            <span>– {formatCents(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-medium">
          <span>Total</span>
          <span>{formatCents(total)}</span>
        </div>
        {error && (
          <p role="alert" className="text-danger-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={paying}
          className="bg-forest-900 text-cream-50 hover:bg-forest-700 mt-2 min-h-11 rounded-(--radius-control) px-4 font-medium disabled:opacity-60"
        >
          {paying ? "Confirmando pagamento…" : "Pagar (simulado)"}
        </button>
      </aside>
    </form>
  );
}

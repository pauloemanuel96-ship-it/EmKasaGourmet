"use client";

import { useRef, useState } from "react";
import { PRODUCTS, UNIT_LABEL } from "@/demo/data";
import {
  interpret,
  type AssistantProposal,
  type AssistantResult,
} from "@/demo/logic";
import { STATUS_LABEL, demo, useDemo, type OrderStatus } from "@/demo/store";
import { formatCents } from "@/lib/money";
import {
  importMediaFromUrl,
  listProductsForPhotos,
} from "@/modules/midia/actions";
import { uploadAndAttach } from "@/modules/midia/browser";
import { findUrl, toRawImageUrl } from "@/modules/midia/links";
import { matchProduct } from "@/modules/midia/matching";

/** Tela "Hoje": disponibilidade e estoque com um toque, no celular (RF-A02). */
export function TodayList() {
  const stock = useDemo((s) => s.stock);
  const tracked = PRODUCTS.filter((p) => !p.madeToOrder);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Hoje</h1>
      {(["horta", "cozinha", "produtos"] as const).map((u) => (
        <section key={u} aria-labelledby={`h-${u}`}>
          <h2 id={`h-${u}`} className="mb-2 text-xl">
            {UNIT_LABEL[u]}
          </h2>
          <ul className="divide-sand-200 bg-paper divide-y rounded-(--radius-media)">
            {tracked
              .filter((p) => p.unit === u)
              .map((p) => {
                const q = stock[p.slug] ?? 0;
                return (
                  <li
                    key={p.slug}
                    className="flex items-center justify-between gap-2 p-3"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-8 w-8 rounded"
                        style={{ backgroundColor: p.tone }}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {p.name}
                        </span>
                        <span
                          className={`text-xs ${q === 0 ? "text-danger-600" : "text-ink-600"}`}
                        >
                          {q === 0 ? "Esgotado" : `${q} ${p.unitLabel}`}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Menos ${p.name}`}
                        disabled={q === 0}
                        onClick={() =>
                          demo.adjustStock(p.slug, -1, "ajuste rápido")
                        }
                        className="border-ink-600/30 min-h-11 min-w-11 rounded-(--radius-control) border disabled:opacity-30"
                      >
                        –
                      </button>
                      <button
                        type="button"
                        aria-label={`Mais ${p.name}`}
                        onClick={() =>
                          demo.adjustStock(p.slug, 1, "entrada rápida")
                        }
                        className="border-ink-600/30 min-h-11 min-w-11 rounded-(--radius-control) border"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={q === 0}
                        onClick={() => demo.setStock(p.slug, 0, "acabou")}
                        className="text-danger-600 min-h-11 rounded-(--radius-control) px-2 text-xs underline disabled:opacity-30"
                      >
                        Acabou
                      </button>
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pago: "em_preparo",
  em_preparo: "saiu_para_entrega",
  saiu_para_entrega: "entregue",
};

export function OrdersBoard() {
  const orders = useDemo((s) => s.orders);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Pedidos</h1>
      {orders.length === 0 && (
        <p className="text-ink-600">
          Nenhum pedido. Faça um na loja para ver o fluxo.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li
            key={o.number}
            className="bg-paper flex flex-col gap-2 rounded-(--radius-media) p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">
                {o.number} · {o.customer.name}
              </span>
              <span>
                {STATUS_LABEL[o.status]} · {formatCents(o.totalCents)}
              </span>
            </div>
            <p className="text-ink-600">
              Entrega {o.deliveryDate.split("-").reverse().join("/")} ·{" "}
              {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {NEXT[o.status] && (
                <button
                  type="button"
                  onClick={() => demo.setOrderStatus(o.number, NEXT[o.status]!)}
                  className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                >
                  Marcar: {STATUS_LABEL[NEXT[o.status]!]}
                </button>
              )}
              {o.status !== "cancelado" && o.status !== "entregue" && (
                <button
                  type="button"
                  onClick={() => demo.setOrderStatus(o.number, "cancelado")}
                  className="text-danger-600 min-h-11 px-2 underline"
                >
                  Cancelar e devolver estoque
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PhotoProduct = {
  id: string;
  slug: string;
  name: string;
  hasCover: boolean;
};

/** Foto (arquivo ou link do GitHub) esperando o assistente saber o produto. */
type PhotoJob = { file?: File; url?: string; preview: string };

type Choice = { label: string; product: PhotoProduct; cover: boolean };

type Msg = {
  from: "chef" | "assistente";
  text: string;
  proposal?: AssistantProposal;
  photo?: string;
  job?: PhotoJob;
  choices?: Choice[];
  state?: "pendente" | "feito" | "descartado" | "enviando";
};

function execute(p: AssistantProposal) {
  const who = "Chef (assistente)";
  switch (p.kind) {
    case "set_stock":
      return demo.setStock(p.slug, p.quantity, "assistente", who, "assistente");
    case "add_stock":
      return demo.adjustStock(
        p.slug,
        p.quantity,
        "assistente",
        who,
        "assistente",
      );
    case "block_date":
      return demo.blockDate(p.iso, who, "assistente");
    case "draft_product":
      return demo.createDraft(p.name, who, "assistente");
    case "set_available_list":
      for (const slug of p.slugs)
        demo.adjustStock(slug, 1, "disponível hoje", who, "assistente");
  }
}

/** Opções de confirmação para a foto de um produto. */
function choicesFor(p: PhotoProduct): Choice[] {
  return p.hasCover
    ? [
        { label: "Pôr na galeria", product: p, cover: false },
        { label: "Trocar a foto principal", product: p, cover: true },
      ]
    : [{ label: "Sim, pode colocar", product: p, cover: true }];
}

/**
 * Assistente operacional.
 * Fotos: REAL (banco e Storage), sempre com confirmação antes de gravar.
 * Estoque, datas e rascunhos: ainda na demonstração (regras; IA na Fase 3).
 */
export function AssistantChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "assistente",
      text: 'Oi, Chef! Me conte como está a cozinha e a horta. Ex.: "Acabou o tomate", "Chegaram 10 alfaces". Para pôr foto num produto, toque em Foto e escreva de qual produto é (ex.: "foto da farofa").',
    },
  ]);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<PhotoJob | null>(null);
  const [waiting, setWaiting] = useState<PhotoJob | null>(null);
  const [busy, setBusy] = useState(false);
  const products = useRef<PhotoProduct[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const say = (...m: Msg[]) => setMsgs((list) => [...list, ...m]);

  async function handlePhoto(job: PhotoJob, words: string, chefMsg: Msg) {
    products.current ??= await listProductsForPhotos();
    const list = products.current;
    if (!words.trim()) {
      setWaiting(job);
      say(chefMsg, {
        from: "assistente",
        text: "Recebi a foto! De qual produto ela é?",
      });
      return;
    }
    const match = matchProduct(words, list);
    setWaiting(null);
    if (match.status === "exato" || match.status === "provavel") {
      const p = match.product;
      const ask =
        match.status === "exato"
          ? `Coloco esta foto em "${p.name}"?`
          : `Você está falando de "${p.name}", certo? Coloco a foto nele?`;
      say(chefMsg, {
        from: "assistente",
        text: p.hasCover ? `${ask} Ele já tem foto principal.` : ask,
        job,
        choices: choicesFor(p),
        state: "pendente",
      });
    } else if (match.status === "ambiguo") {
      say(chefMsg, {
        from: "assistente",
        text: "Achei mais de um produto parecido. Qual deles?",
        job,
        choices: match.options.map((p) => ({
          label: p.name,
          product: p,
          cover: !p.hasCover,
        })),
        state: "pendente",
      });
    } else {
      setWaiting(job);
      say(chefMsg, {
        from: "assistente",
        text:
          list.length === 0
            ? "Ainda não há produtos cadastrados. Cadastre o produto em Produtos e me mande a foto de novo."
            : `Não achei produto com esse nome. Me diga o nome como está cadastrado (ex.: "${list[0].name}").`,
      });
    }
  }

  async function send() {
    const raw = text.trim();
    const link = findUrl(raw);
    const words = link ? raw.replace(link, " ").trim() : raw;
    if (!raw && !photo) return;
    setText("");

    // Foto anexada, link do GitHub, ou resposta sobre uma foto que ficou esperando.
    let job: PhotoJob | null = photo ?? waiting;
    if (link) {
      const url = toRawImageUrl(link);
      if (!url) {
        say(
          { from: "chef", text: raw },
          {
            from: "assistente",
            text: "Esse link não é de uma imagem do GitHub. Mande o link da foto no GitHub ou anexe a foto.",
          },
        );
        return;
      }
      job = { url: url.href, preview: url.href };
    }
    if (job) {
      setPhoto(null);
      setBusy(true);
      try {
        await handlePhoto(job, words, {
          from: "chef",
          text: raw || "📷",
          photo: job === waiting ? undefined : job.preview,
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    const r: AssistantResult = interpret(raw, new Date());
    const reply: Msg =
      r.type === "proposal"
        ? r.needsConfirmation
          ? {
              from: "assistente",
              text: `Vou fazer isto: ${r.proposal.summary}`,
              proposal: r.proposal,
              state: "pendente",
            }
          : (execute(r.proposal),
            {
              from: "assistente",
              text: `Feito: ${r.proposal.summary}`,
              state: "feito",
            })
        : r.type === "ambiguous"
          ? {
              from: "assistente",
              text: `${r.message} ${r.options.join(" / ")}`,
            }
          : { from: "assistente", text: r.message };
    say({ from: "chef", text: raw }, reply);
  }

  function decide(i: number, ok: boolean) {
    setMsgs((m) =>
      m.map((x, j) => {
        if (j !== i || !x.proposal) return x;
        if (ok) execute(x.proposal);
        return { ...x, state: ok ? "feito" : "descartado" };
      }),
    );
  }

  async function choosePhoto(i: number, choice: Choice | null) {
    const msg = msgs[i];
    if (!msg.job) return;
    if (!choice) {
      setMsgs((m) =>
        m.map((x, j) => (j === i ? { ...x, state: "descartado" } : x)),
      );
      setWaiting(msg.job);
      say({
        from: "assistente",
        text: "Tudo bem. De qual produto é a foto, então?",
      });
      return;
    }
    setMsgs((m) =>
      m.map((x, j) => (j === i ? { ...x, state: "enviando" } : x)),
    );
    const { product, cover } = choice;
    const result = msg.job.file
      ? await uploadAndAttach({
          file: msg.job.file,
          productId: product.id,
          productSlug: product.slug,
          alt: product.name,
          cover,
        })
      : await importMediaFromUrl({
          productId: product.id,
          url: msg.job.url!,
          cover,
          alt: product.name,
        });
    // Só diz que fez depois que o banco confirmou.
    setMsgs((m) =>
      m.map((x, j) =>
        j === i
          ? { ...x, state: result.status === "ok" ? "feito" : "pendente" }
          : x,
      ),
    );
    if (result.status === "ok") {
      products.current =
        products.current?.map((p) =>
          p.id === product.id ? { ...p, hasCover: p.hasCover || cover } : p,
        ) ?? null;
      say({
        from: "assistente",
        text: `Pronto! A foto está em "${product.name}"${cover ? " como foto principal" : ", na galeria"}. Já aparece na loja.`,
      });
    } else if (result.status === "error") {
      say({ from: "assistente", text: `Não consegui: ${result.message}` });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">Assistente</h1>
      <p className="text-ink-600 text-sm">
        Fotos de produto são gravadas de verdade (com sua confirmação). Estoque,
        datas e rascunhos por aqui ainda são demonstração.
      </p>
      <ul className="flex flex-col gap-3" aria-live="polite">
        {msgs.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-(--radius-media) p-3 text-sm ${m.from === "chef" ? "bg-forest-900 text-cream-50 self-end" : "bg-paper"}`}
          >
            {m.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- prévia local da foto anexada
              <img
                src={m.photo}
                alt="Foto enviada"
                className="mb-2 max-h-48 rounded-(--radius-control) object-cover"
              />
            )}
            <p>{m.text}</p>
            {m.proposal && m.state === "pendente" && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(i, true)}
                  className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => decide(i, false)}
                  className="border-ink-600/30 min-h-11 rounded-(--radius-control) border px-4"
                >
                  Descartar
                </button>
              </div>
            )}
            {m.choices && m.state === "pendente" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.choices.map((c) => (
                  <button
                    key={`${c.product.id}-${c.cover}`}
                    type="button"
                    onClick={() => choosePhoto(i, c)}
                    className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4"
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => choosePhoto(i, null)}
                  className="border-ink-600/30 min-h-11 rounded-(--radius-control) border px-4"
                >
                  Não é esse
                </button>
              </div>
            )}
            {m.state === "enviando" && (
              <p className="text-ink-600 mt-1 text-xs">Enviando a foto…</p>
            )}
            {m.state === "feito" && (m.proposal || m.choices) && (
              <p className="text-forest-700 mt-1 text-xs">
                ✓ Registrado no histórico
              </p>
            )}
            {m.state === "descartado" && (
              <p className="text-ink-600 mt-1 text-xs">Descartado</p>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="bg-cream-50/95 sticky bottom-2 flex flex-col gap-2 rounded-(--radius-media) p-1"
      >
        {photo && (
          <div className="flex items-center gap-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local antes do envio */}
            <img
              src={photo.preview}
              alt="Foto anexada"
              className="size-14 rounded-(--radius-control) object-cover"
            />
            <span>Foto anexada. Escreva de qual produto é.</span>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-danger-600 min-h-11 underline"
            >
              Tirar
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPhoto({ file: f, preview: URL.createObjectURL(f) });
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="border-ink-600/30 bg-paper min-h-11 rounded-(--radius-control) border px-3 text-sm font-medium"
            aria-label="Anexar foto"
          >
            📷 Foto
          </button>
          <label htmlFor="msg" className="sr-only">
            Mensagem
          </label>
          <input
            id="msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              photo
                ? "Ex.: foto da farofa"
                : "Escreva como falaria no WhatsApp…"
            }
            className="border-ink-600/30 bg-paper min-h-11 min-w-0 flex-1 rounded-(--radius-control) border px-3"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 font-medium disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

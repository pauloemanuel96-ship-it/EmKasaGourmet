"use client";

/**
 * Estado do protótipo, salvo no navegador (localStorage).
 * Uma única fonte para loja e painel: o que a Chef muda na tela Hoje aparece na loja na hora.
 * Será substituído pelo Supabase módulo a módulo.
 */
import { useSyncExternalStore } from "react";
import {
  BOX_PLANS,
  CLUB_POINTS_PER_REAL,
  DELIVERY_ZONES,
  INITIAL_STOCK,
  PRODUCTS,
  productBySlug,
  type BoxPlan,
  type Storage,
} from "./data";
import type { BoxItem, Member } from "./logic";

export type OrderStatus =
  "pago" | "em_preparo" | "saiu_para_entrega" | "entregue" | "cancelado";

/**
 * Cópia do produto no momento em que entrou no carrinho. Necessária para
 * produtos do banco, que não estão na lista de demonstração.
 */
export type CartSnap = {
  name: string;
  unitLabel: string;
  priceCents: number;
  storage: Storage;
  madeToOrder: boolean;
};

export type OrderLine = {
  slug: string;
  name: string;
  unitLabel: string;
  priceCents: number;
  quantity: number;
};

export type Order = {
  number: string;
  createdAt: string;
  customer: { name: string; phone: string };
  zoneId: string;
  deliveryDate: string;
  payment: "pix" | "cartao";
  lines: OrderLine[];
  subtotalCents: number;
  feeCents: number;
  discountCents: number;
  totalCents: number;
  status: OrderStatus;
  origin: "loja" | "box" | "assinatura";
};

export type Subscription = {
  planCode: BoxPlan["code"];
  frequency: "semanal" | "quinzenal";
  status: "ativa" | "pausada" | "cancelada";
  items: BoxItem[];
  nextDate: string | null;
  zoneId: string;
};

export type AuditEntry = {
  at: string;
  actor: string;
  source: "painel" | "assistente" | "loja" | "sistema";
  text: string;
};

export type DemoState = {
  version: 1;
  stock: Record<string, number>;
  priceOverrides: Record<string, number>;
  cart: { slug: string; quantity: number; snap?: CartSnap }[];
  orders: Order[];
  members: Member[];
  healthConsent: boolean;
  subscription: Subscription | null;
  points: number;
  blockedDates: string[];
  drafts: { name: string; createdAt: string }[];
  audit: AuditEntry[];
};

const KEY = "emkasa-demo-v1";

function initialState(): DemoState {
  return {
    version: 1,
    stock: { ...INITIAL_STOCK },
    priceOverrides: {},
    cart: [],
    orders: [],
    members: [],
    healthConsent: false,
    subscription: null,
    points: 0,
    blockedDates: [],
    drafts: [],
    audit: [],
  };
}

const SERVER_STATE = initialState();
let state: DemoState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed?.version === 1) state = { ...initialState(), ...parsed };
    }
  } catch {
    // armazenamento indisponível: segue em memória
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignora (modo privado, cota cheia)
  }
}

function set(updater: (s: DemoState) => DemoState) {
  load();
  state = updater(state);
  persist();
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

export function useDemo<T>(selector: (s: DemoState) => T): T {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
  return selector(s);
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------
export function priceOf(s: DemoState, slug: string): number {
  return s.priceOverrides[slug] ?? productBySlug(slug)?.priceCents ?? 0;
}

export function availableOf(s: DemoState, slug: string): number {
  const p = productBySlug(slug);
  // Produto do banco: a disponibilidade vem da loja (botão some se esgotado).
  if (!p || p.madeToOrder) return 99;
  return Math.max(0, s.stock[slug] ?? 0);
}

export function cartLines(s: DemoState): OrderLine[] {
  return s.cart
    .map((c) => {
      const p = productBySlug(c.slug);
      if (!p) {
        if (!c.snap) return null;
        return {
          slug: c.slug,
          name: c.snap.name,
          unitLabel: c.snap.unitLabel,
          priceCents: c.snap.priceCents,
          quantity: c.quantity,
        };
      }
      return {
        slug: p.slug,
        name: p.name,
        unitLabel: p.unitLabel,
        priceCents: priceOf(s, p.slug),
        quantity: c.quantity,
      };
    })
    .filter((l): l is OrderLine => l !== null);
}

export function cartCount(s: DemoState): number {
  return s.cart.reduce((n, c) => n + c.quantity, 0);
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------
const now = () => new Date().toISOString();

function log(s: DemoState, entry: Omit<AuditEntry, "at">): DemoState {
  return { ...s, audit: [{ ...entry, at: now() }, ...s.audit].slice(0, 200) };
}

export const demo = {
  reset() {
    set(() => initialState());
  },

  addToCart(
    slug: string,
    quantity = 1,
    snap?: CartSnap,
  ): { ok: boolean; message: string } {
    load();
    const inCart = state.cart.find((c) => c.slug === slug)?.quantity ?? 0;
    const available = availableOf(state, slug);
    if (inCart + quantity > available) {
      return {
        ok: false,
        message:
          available === 0
            ? "Produto esgotado."
            : `Só temos ${available} disponível(is).`,
      };
    }
    set((s) => {
      const exists = s.cart.some((c) => c.slug === slug);
      const cart = exists
        ? s.cart.map((c) =>
            c.slug === slug ? { ...c, quantity: c.quantity + quantity } : c,
          )
        : [...s.cart, snap ? { slug, quantity, snap } : { slug, quantity }];
      return { ...s, cart };
    });
    return { ok: true, message: "Adicionado ao carrinho." };
  },

  setCartQuantity(slug: string, quantity: number) {
    set((s) => {
      const max = availableOf(s, slug);
      const q = Math.max(0, Math.min(quantity, max));
      return {
        ...s,
        cart:
          q === 0
            ? s.cart.filter((c) => c.slug !== slug)
            : s.cart.map((c) => (c.slug === slug ? { ...c, quantity: q } : c)),
      };
    });
  },

  addBoxToCart(items: BoxItem[]) {
    for (const i of items) demo.addToCart(i.slug, i.quantity);
  },

  placeOrder(input: {
    name: string;
    phone: string;
    zoneId: string;
    deliveryDate: string;
    payment: "pix" | "cartao";
    usePoints: boolean;
  }): { ok: true; number: string } | { ok: false; message: string } {
    load();
    const lines = cartLines(state);
    if (lines.length === 0)
      return { ok: false, message: "Seu carrinho está vazio." };
    for (const l of lines) {
      if (l.quantity > availableOf(state, l.slug)) {
        return {
          ok: false,
          message: `${l.name}: estoque mudou. Ajuste a quantidade.`,
        };
      }
    }
    const zone = DELIVERY_ZONES.find((z) => z.id === input.zoneId);
    if (!zone) return { ok: false, message: "Escolha a forma de entrega." };

    const subtotal = lines.reduce((t, l) => t + l.priceCents * l.quantity, 0);
    const discount =
      input.usePoints && state.points >= 250 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + zone.feeCents - discount;
    const number = `EMK-${String(1000 + state.orders.length + 1)}`;

    set((s) => {
      const stock = { ...s.stock };
      for (const l of lines) {
        const p = productBySlug(l.slug);
        if (p && !p.madeToOrder)
          stock[l.slug] = (stock[l.slug] ?? 0) - l.quantity;
      }
      const order: Order = {
        number,
        createdAt: now(),
        customer: { name: input.name, phone: input.phone },
        zoneId: zone.id,
        deliveryDate: input.deliveryDate,
        payment: input.payment,
        lines,
        subtotalCents: subtotal,
        feeCents: zone.feeCents,
        discountCents: discount,
        totalCents: total,
        status: "pago",
        origin: "loja",
      };
      const earned = Math.floor(total / 100) * CLUB_POINTS_PER_REAL;
      const points = s.points - (discount > 0 ? 250 : 0) + earned;
      return log(
        { ...s, stock, cart: [], orders: [order, ...s.orders], points },
        {
          actor: input.name,
          source: "loja",
          text: `Pedido ${number} pago (simulado) · ${lines.length} item(ns)`,
        },
      );
    });
    return { ok: true, number };
  },

  setOrderStatus(number: string, status: OrderStatus, actor = "Painel") {
    set((s) => {
      const order = s.orders.find((o) => o.number === number);
      if (!order || order.status === status) return s;
      let stock = s.stock;
      if (status === "cancelado") {
        stock = { ...s.stock };
        for (const l of order.lines)
          if (productBySlug(l.slug) && !productBySlug(l.slug)?.madeToOrder)
            stock[l.slug] = (stock[l.slug] ?? 0) + l.quantity;
      }
      const orders = s.orders.map((o) =>
        o.number === number ? { ...o, status } : o,
      );
      return log(
        { ...s, stock, orders },
        {
          actor,
          source: "painel",
          text: `Pedido ${number}: ${STATUS_LABEL[order.status]} → ${STATUS_LABEL[status]}`,
        },
      );
    });
  },

  adjustStock(
    slug: string,
    delta: number,
    reason: string,
    actor = "Painel",
    source: AuditEntry["source"] = "painel",
  ) {
    set((s) => {
      const before = s.stock[slug] ?? 0;
      const after = Math.max(0, before + delta);
      if (after === before) return s;
      const name = productBySlug(slug)?.name ?? slug;
      return log(
        { ...s, stock: { ...s.stock, [slug]: after } },
        { actor, source, text: `${name}: ${before} → ${after} (${reason})` },
      );
    });
  },

  setStock(
    slug: string,
    value: number,
    reason: string,
    actor = "Painel",
    source: AuditEntry["source"] = "painel",
  ) {
    load();
    demo.adjustStock(
      slug,
      Math.max(0, value) - (state.stock[slug] ?? 0),
      reason,
      actor,
      source,
    );
  },

  setPrice(slug: string, cents: number, actor = "Painel") {
    set((s) => {
      const before = priceOf(s, slug);
      if (before === cents) return s;
      const name = productBySlug(slug)?.name ?? slug;
      return log(
        { ...s, priceOverrides: { ...s.priceOverrides, [slug]: cents } },
        {
          actor,
          source: "painel",
          text: `Preço de ${name}: ${before / 100} → ${cents / 100}`,
        },
      );
    });
  },

  blockDate(
    iso: string,
    actor = "Painel",
    source: AuditEntry["source"] = "painel",
  ) {
    set((s) =>
      s.blockedDates.includes(iso)
        ? s
        : log(
            { ...s, blockedDates: [...s.blockedDates, iso] },
            {
              actor,
              source,
              text: `Entregas bloqueadas em ${iso.split("-").reverse().join("/")}`,
            },
          ),
    );
  },

  unblockDate(iso: string) {
    set((s) =>
      log(
        { ...s, blockedDates: s.blockedDates.filter((d) => d !== iso) },
        {
          actor: "Painel",
          source: "painel",
          text: `Entregas liberadas em ${iso.split("-").reverse().join("/")}`,
        },
      ),
    );
  },

  createDraft(
    name: string,
    actor = "Painel",
    source: AuditEntry["source"] = "painel",
  ) {
    set((s) =>
      log(
        { ...s, drafts: [{ name, createdAt: now() }, ...s.drafts] },
        { actor, source, text: `Rascunho criado: ${name}` },
      ),
    );
  },

  setHousehold(members: Member[], consent: boolean) {
    set((s) => ({ ...s, members, healthConsent: consent }));
  },

  subscribe(sub: Omit<Subscription, "status">) {
    set((s) =>
      log(
        { ...s, subscription: { ...sub, status: "ativa" } },
        {
          actor: "Cliente",
          source: "loja",
          text: `Assinatura ${planName(sub.planCode)} (${sub.frequency}) criada`,
        },
      ),
    );
  },

  setSubscriptionStatus(status: Subscription["status"]) {
    set((s) =>
      s.subscription
        ? log(
            { ...s, subscription: { ...s.subscription, status } },
            { actor: "Cliente", source: "loja", text: `Assinatura: ${status}` },
          )
        : s,
    );
  },

  setSubscriptionFrequency(frequency: Subscription["frequency"]) {
    set((s) =>
      s.subscription
        ? { ...s, subscription: { ...s.subscription, frequency } }
        : s,
    );
  },

  redeem(points: number, label: string) {
    set((s) =>
      s.points < points
        ? s
        : log(
            { ...s, points: s.points - points },
            {
              actor: "Cliente",
              source: "loja",
              text: `Resgate no Clube: ${label}`,
            },
          ),
    );
  },
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pago: "Pago",
  em_preparo: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function planName(code: BoxPlan["code"]): string {
  return BOX_PLANS.find((p) => p.code === code)?.name ?? code;
}

export { PRODUCTS };

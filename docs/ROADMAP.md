# ROADMAP — Emkasa Gourmet

> v0.1. Cada fase só começa quando a anterior cumpre o **critério de conclusão**: a Chef consegue usar no dia a dia.
> Estimativas consideram 1 desenvolvedor em meio período com o Claude Code como executor. Ajustar após o Sprint 1.

## Visão geral

| Fase | Entrega | Depende de | Estimativa |
|---|---|---|---|
| **0. Fundação** | Docs, repositório, Supabase, CI, design tokens | — | 1 semana |
| **1. Catálogo + Painel + Estoque** | Loja navegável com dados reais; Chef atualiza estoque no celular | F0 + fotos e lista de produtos | 2–3 semanas |
| **2. Venda** | Carrinho, checkout, Mercado Pago, entregas, pedidos no painel, WhatsApp, receitas → **LANÇAMENTO** | F1 + regras de entrega e frete + conta MP | 2–3 semanas |
| **3. Assistente operacional** | Conversa no painel com propostas e confirmação | F2 rodando há 2+ semanas | 2 semanas |
| **4. BOX + Minha Casa** | BOX avulso por perfil, compatibilidade de alergênicos, consentimento LGPD | F2 + fichas técnicas validadas | 3 semanas |
| **5. Assinaturas** | Ciclos semanais/quinzenais, pausar, editar, cobrança recorrente | F4 com BOX vendendo | 3 semanas |
| **6. Expansão** | Escola (cursos), Clube, Parceiros, WhatsApp Cloud API, B2B, app (Capacitor) | Demanda comprovada | sob demanda |

### Decisão de prioridade (e o que mudou em relação ao briefing)
O briefing colocava a interface conversacional no MVP. **Recomendo a Fase 3**, com uma substituta melhor no MVP: a tela **"Hoje"** (RF-A02), que resolve 80% da atualização diária com toques, sem custo de IA e sem risco de interpretação errada. O assistente entra quando o fluxo real de pedidos já estiver estável, para que ele opere sobre dados de verdade. A arquitetura dele já está pronta (SYSTEM_ARCHITECTURE §4.3).

## Critérios de conclusão

### Fase 0
- [ ] Repositório no GitHub, `main` protegida, CI verde (lint + typecheck + test)
- [ ] Projeto Supabase criado, migrations iniciais aplicadas, RLS ligado
- [ ] Deploy de preview funcionando
- [ ] Tokens de design no Tailwind + fontes carregadas
- [ ] PENDENCIAS.md revisado com a Chef

### Fase 1
- [ ] Home, catálogo, busca e página de produto com dados **reais** (mínimo de 15 produtos com foto)
- [ ] Painel: login, papéis, CRUD de produto com ingredientes/alergênicos, tela "Hoje", histórico de estoque, auditoria
- [ ] Alterar disponibilidade no painel reflete na loja em < 5 s
- [ ] Testes pgTAP de estoque e RLS passando; Lighthouse mobile ≥ 90 em Performance e Acessibilidade
- [ ] **A Chef atualiza o estoque sozinha por 1 semana**

### Fase 2 (lançamento)
- [ ] Pedido de ponta a ponta com Pix e cartão em sandbox **e** um pedido real de baixo valor em produção
- [ ] Concorrência testada: 2 pedidos simultâneos no último item → 1 sucesso, 1 recusa clara
- [ ] Webhook duplicado não duplica nada; reserva expira e devolve estoque
- [ ] Políticas (privacidade, troca/cancelamento, entrega) publicadas, com texto aprovado pela empresa
- [ ] Backup diário rodando e 1 restauração testada
- [ ] Hospedagem de produção conforme D-003 (sem uso comercial em plano Hobby)

### Fases 3–6
Critérios detalhados ao fim da fase anterior, com base no uso real.

## Sprint 1 (proposto): Fundação + início do catálogo, 2 semanas

**Objetivo:** ao fim do sprint, a Chef abre o celular, entra no painel e vê os produtos reais. A loja já mostra o catálogo com a nova cara.

| # | Tarefa | Saída verificável |
|---|---|---|
| 1 | Criar app Next.js + TS strict + Tailwind + shadcn/ui + ESLint/Prettier + Vitest | `pnpm dev` e `pnpm test` ok |
| 2 | GitHub Actions: lint, typecheck, test | CI verde no PR |
| 3 | Supabase CLI local + projeto remoto; `.env.example` | conexão nos dois ambientes |
| 4 | Migration 001: enums, `categories`, `producers`, `locations`, `products`, `product_media` | tabelas + RLS (leitura pública só de `active`) |
| 5 | Migration 002: `allergens`, `ingredients`, ligações, trigger de alergênicos por ingrediente | teste pgTAP do trigger |
| 6 | Migration 003: `inventory_movements`, `stock_levels`, trigger, `register_stock_movement`, view de disponibilidade | teste pgTAP: saldo nunca negativo |
| 7 | Migration 004: `staff_roles`, `has_role()`, `audit_log` + trigger genérico, `settings` | teste de RLS por papel |
| 8 | Auth do painel (magic link) + middleware de proteção `/admin` | usuário sem papel recebe 403 |
| 9 | Tokens do DESIGN_SYSTEM no Tailwind, fontes via `next/font`, layout base da loja e do painel | página de estilo `/dev/ui` (apenas em dev) |
| 10 | Painel: lista e formulário de produto (sem fotos ainda) | criar/editar produto com auditoria |
| 11 | Loja: catálogo e página de produto lendo do banco | navegável no celular |
| 12 | Seed `[DEMO]` + importação da lista real de produtos (CSV → script) | catálogo real carregado |

**Fora do Sprint 1:** carrinho, pagamento, entregas, IA, BOX.
**Próximo (Sprint 2):** upload de fotos, tela "Hoje", busca, home editorial, histórico de estoque.

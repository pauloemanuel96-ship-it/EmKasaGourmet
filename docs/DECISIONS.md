# DECISIONS — Emkasa Gourmet

> Registro de decisões (ADR curto). Status: **Aceita**, **Proposta** (aguarda Paulo) ou **Substituída**.
> Preços consultados em 15/11/2026; conferir nos sites oficiais antes de contratar.

## D-001 — Next.js + TypeScript + Tailwind + shadcn/ui · **Aceita**
**Por quê:** SSR/ISR para SEO de catálogo e receitas, Server Actions reduzem API própria, ecossistema enorme e é o que o Claude Code domina melhor. shadcn/ui copia componentes para o repo (sem dependência travada).
**Alternativas:** Astro (ótimo para conteúdo, mais fraco para painel interativo); Remix (equivalente, comunidade menor).

## D-002 — Supabase (Postgres + Auth + Storage) · **Aceita**
**Por quê:** Postgres real (transações, constraints, RLS, pg_cron) é obrigatório para estoque e pedidos. Auth e Storage no mesmo lugar reduzem peças.
**Alternativas:** Firebase (NoSQL dificulta estoque transacional e relatórios); Neon + Auth.js (mais peças para manter).
**Custo e limite:** o plano Free tem 2 projetos ativos e 500 MB de banco por projeto, pausa após 1 semana de inatividade e não inclui backup. O Pro custa a partir de US$ 25/mês, com backup diário.
**Decisão:** começar no Free + backup externo diário (GitHub Actions). Migrar para o Pro quando o faturamento mensal justificar ou ao lançar assinaturas (Fase 5), o que vier primeiro. Uma loja com pedidos diários não fica 7 dias inativa, mas o risco está documentado.

## D-003 — Hospedagem · **Proposta (decisão do Paulo antes do lançamento)**
**Fato:** o plano Hobby da Vercel é restrito a uso pessoal e não comercial. Uso comercial exige o Pro (US$ 20/usuário/mês). Uma loja que vende **é** uso comercial.
**Opções:**
| Opção | Custo | Prós | Contras |
|---|---|---|---|
| A. Vercel Pro | US$ 20/mês | zero atrito com Next.js, previews automáticos | custo fixo desde o lançamento |
| B. Cloudflare Workers (adaptador OpenNext) | gratuito até limites generosos **[conferir termos/limites no início da Fase 2]** | custo zero, CDN global | alguns recursos do Next exigem ajuste; mais configuração |
| C. VPS própria (Coolify/Docker) | ~US$ 5–7/mês | controle total | Paulo vira responsável por servidor, atualizações e segurança |

**Recomendação:** desenvolver na Vercel Hobby (protótipo é permitido) e, na Fase 2, **testar a opção B**. Se funcionar sem gambiarra, lançar nela; se der atrito, Vercel Pro. Evitar C enquanto a equipe técnica for uma pessoa.

## D-004 — Sem n8n no MVP · **Aceita**
**Por quê:** os jobs do MVP (expirar reservas, lembretes) cabem no `pg_cron`. n8n exige servidor próprio ou plano pago e vira mais um sistema para manter.
**Reavaliar:** Fase 5–6 (automações de marketing, integrações com terceiros).

## D-005 — Mercado Pago Checkout Pro · **Aceita**
**Por quê:** o cartão é digitado no ambiente do MP (sem PCI na plataforma), aceita Pix e cartão, não tem mensalidade e o Paulo já conhece a operação e as contestações do MP.
**Custo de referência (Checkouts MP, nov/2026):** Pix 0,99%; crédito entre 3,98% e 4,98% conforme o prazo de recebimento. Conferir na conta da Emkasa.
**Alternativas:** Checkout Transparente (melhor UX, mais trabalho e mais responsabilidade); Stripe (Pix com menos maturidade local); Pix manual (zero taxa, mas conciliação manual: aceitável só como plano B).
**Assinaturas (Fase 5):** avaliar "Planos de assinatura" do MP vs. cobrança por ciclo gerada pelo sistema.

## D-006 — Estoque como livro-razão · **Aceita**
Saldo derivado de `inventory_movements` imutáveis; `stock_levels` materializado por trigger com `CHECK available >= 0`.
**Por quê:** atende "quem, quando, quanto e por quê", permite auditoria e reconstrução, e o banco impede venda sem estoque mesmo com bug na aplicação.

## D-007 — Regras críticas em funções Postgres · **Aceita**
`create_order`, `confirm_payment`, `cancel_order` e `register_stock_movement` ficam no banco, em transação com lock de linha.
**Trade-off:** SQL é menos familiar que TS, por isso exige teste pgTAP obrigatório para cada função.

## D-008 — Assistente operacional na Fase 3, tela "Hoje" no MVP · **Proposta**
Ver ROADMAP. Reduz risco e custo no lançamento, e a IA chega depois operando sobre fluxo real.

## D-009 — Busca no Postgres · **Aceita**
FTS `portuguese` + `unaccent` + `pg_trgm`. Algolia/Meilisearch só se o catálogo passar de alguns milhares de itens.

## D-010 — Skills do Claude Code · **Aceita**
Mantidas as skills já instaladas, de fontes oficiais e conhecidas: `supabase`, `supabase-postgres-best-practices`, `vercel-react-best-practices`, `ui-ux-pro-max`.
**Não instalar** os repositórios sugeridos no briefing do ChatGPT (`tyfarrago-hub/taste`, `dawitlabs/ui-skills`, `darasoba/agent-skills`, `Jamaalx/claude-skills`) sem antes ler o conteúdo: são autores desconhecidos, skills podem conter scripts executáveis, e sobrepõem o que já está instalado. Se um deles for adotado, registrar aqui com o motivo.
**Auditoria de segurança antes do lançamento:** feita com checklist próprio (SECURITY_AND_PRIVACY) + revisão de código, não com skill de terceiros.

## D-011 — Checkout sem conta · **Aceita**
Menos atrito na primeira compra; conta opcional depois. Telefone como identificador do cliente.

## D-012 — PWA agora, Capacitor depois · **Aceita**
Manifest + ícones no MVP. App nas lojas só quando houver motivo (notificações push nativas, assinatura recorrente madura).

## D-013 — "BOX orgânicos" renomeado para "BOX da Horta" · **Proposta**
Até a validação da certificação dos produtores (SECURITY_AND_PRIVACY §6).

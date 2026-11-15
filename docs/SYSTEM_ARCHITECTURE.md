# SYSTEM_ARCHITECTURE — Emkasa Gourmet

> v0.1. Justificativas e alternativas em DECISIONS.md.

## 1. Visão geral

```
                 ┌──────────────────────────── Next.js (App Router, TS) ────────────────────────────┐
 Cliente ──────► │  (loja)  páginas públicas  · RSC + ISR para catálogo                             │
 (celular)       │  (admin) painel /admin     · Server Actions                                      │
 Chef/Admin ───► │  /api/webhooks/mercadopago · /api/assistant (Fase 3)                             │
                 │                                                                                  │
                 │  src/modules/*  ← regras de negócio (catálogo, estoque, pedidos, entregas, IA)   │
                 └───────────────┬───────────────────────────────┬──────────────────────────────────┘
                                 │ supabase-js (anon + sessão)   │ service role (só no servidor)
                 ┌───────────────▼───────────────────────────────▼──────────────────────────────────┐
                 │ Supabase: Postgres + RLS · funções SQL transacionais · pg_cron · Auth · Storage  │
                 └───────────────┬──────────────────────────────────────────────────────────────────┘
                                 │
        Mercado Pago (Checkout Pro + webhook) · Claude API (Fase 3) · WhatsApp (links wa.me → Cloud API na Fase 6)
        GitHub Actions: CI (lint, typecheck, testes) + backup diário do banco
```

## 2. Camadas
| Camada | Onde | Responsabilidade |
|---|---|---|
| Apresentação | `src/app`, `src/components` | UI e composição. Não decide regra de negócio |
| Domínio | `src/modules/<modulo>` | Casos de uso (`createOrder`, `adjustStock`…), validação Zod, orquestração |
| Dados críticos | `supabase/migrations` (funções SQL) | Invariantes que **não podem falhar**: reserva de estoque, criação de pedido, confirmação de pagamento |
| Integrações | `src/services` | Mercado Pago, Claude, WhatsApp, e-mail. Atrás de interfaces simples, trocáveis |

**Por que regras críticas no Postgres?** Uma corrida de dois clientes pelo último pote de farofa só se resolve com bloqueio de linha dentro da transação. Fazer isso no Node, com várias chamadas HTTP, abre brecha de concorrência.

## 3. Módulos (`src/modules`)
| Módulo | Fase | Conteúdo |
|---|---|---|
| `catalogo` | 1 | produtos, categorias, mídia, ingredientes, alergênicos, rótulos, busca |
| `estoque` | 1 | movimentações, saldos, tela "Hoje", reservas |
| `entregas` | 1–2 | zonas, dias, datas bloqueadas, prazo de corte |
| `pedidos` | 2 | carrinho (client-side + validação no servidor), checkout, status |
| `pagamentos` | 2 | Mercado Pago: preferência, webhook idempotente, estorno |
| `auditoria` | 1 | `audit_log` via trigger + consulta no painel |
| `conteudo` | 2 | receitas e páginas institucionais |
| `assistente` | 3 | interpretação → proposta → confirmação → ferramentas |
| `box`, `casa`, `assinaturas`, `escola`, `clube`, `parceiros` | 4–6 | apenas modelados no DATABASE_SCHEMA |

## 4. Fluxos críticos

### 4.1 Criação de pedido
1. Cliente envia o carrinho → Server Action valida com Zod (ids, quantidades, zona, data).
2. Chama `rpc('create_order', payload)`, uma função SQL `security definer` que, numa única transação:
   - recalcula preços a partir do banco (nunca confia no preço do cliente);
   - `SELECT ... FOR UPDATE` nos saldos e falha se faltar estoque;
   - grava `orders`, `order_items` e movimentos `reserve`;
   - define `reserved_until = now() + interval` (configurável).
3. Servidor cria a preferência no Mercado Pago com `external_reference = order.id` e redireciona.
4. **Webhook** `/api/webhooks/mercadopago`: valida a assinatura, **consulta o pagamento na API do MP** (não confia no corpo), e chama `rpc('confirm_payment')`, que é idempotente por `provider_payment_id`.
5. `pg_cron` a cada 5 min executa `release_expired_reservations()`.

### 4.2 Atualização da Chef (tela "Hoje")
Botão → Server Action → `rpc('register_stock_movement', {product, delta|absolute, reason})` → trigger atualiza `stock_levels` e grava `audit_log` → `revalidateTag('catalogo')` reflete na loja imediatamente.

### 4.3 Assistente operacional (Fase 3)
```
mensagem → Claude (tool use, prompt de sistema + catálogo resumido)
        → ferramentas de LEITURA (buscar produto, ver saldo) executadas livremente
        → ferramentas de ESCRITA geram uma linha em assistant_actions (status = proposed)
        → UI mostra o cartão "Vou fazer isto: … [Confirmar] [Corrigir]"
        → confirmação → servidor executa a função de domínio (mesma usada pelo painel)
        → status = executed + audit_log (source = 'assistant')
```
A política de quais ações dispensam confirmação vive em código (lista fixa), não no prompt.

## 5. Tecnologias
| Item | Escolha | Observação |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript `strict` | Confirmar a versão estável atual ao iniciar o sprint |
| UI | Tailwind CSS + shadcn/ui (componentes copiados, não dependência) | Tokens do DESIGN_SYSTEM |
| Formulários | react-hook-form + Zod | Zod compartilhado entre cliente e servidor |
| Banco/Auth/Storage | Supabase | `@supabase/ssr` para sessão em Server Components |
| Busca | Postgres FTS (`portuguese` + `unaccent`) + `pg_trgm` | Sem Algolia: custo zero, e o volume é pequeno |
| Imagens | Supabase Storage + otimização do Next/Image | Fotos enviadas pelo painel, redimensionadas no upload |
| Pagamento | Mercado Pago Checkout Pro | Ver D-005 |
| IA | Claude API (Fase 3) | Modelo econômico para interpretação e chave só no servidor |
| Jobs | `pg_cron` no Supabase | Substitui n8n no MVP |
| Testes | Vitest (domínio) + testes SQL (pgTAP) + Playwright (fluxo de compra) | |
| CI | GitHub Actions | lint, typecheck, test em cada push/PR |
| Hospedagem | Vercel Hobby (dev) → produção conforme D-003 | Hobby **não permite uso comercial** |

## 6. Integrações
- **Mercado Pago:** Checkout Pro (redirect). Pix e cartão. Webhook com verificação de assinatura e reconsulta na API. Credenciais de teste até o go-live.
- **WhatsApp:** MVP com link `wa.me` e mensagem pré-preenchida (custo zero). Na Fase 6, WhatsApp Cloud API para o assistente e notificações (avaliar custo por conversa).
- **Claude API:** só no servidor. Limite de taxa por usuário, registro de uso (tokens) em `assistant_actions`.
- **E-mail transacional:** opcional na Fase 2 (confirmação de pedido). Escolher provedor com plano gratuito quando for implementar.
- **n8n:** fora do MVP. Reavaliar quando houver automações de marketing (D-008).

## 7. Backup e recuperação
- Plano Free do Supabase **não inclui backups**. Mitigação: GitHub Action diária com `pg_dump` (via `supabase db dump`) → artefato criptografado num repositório privado ou storage externo, retenção de 30 dias.
- Teste de restauração mensal num projeto de staging.
- Ao migrar para o Supabase Pro: backups diários nativos (7 dias). O dump externo continua como segunda cópia.
- Migrations versionadas permitem recriar o schema do zero.

## 8. Ambientes
| Ambiente | Banco | Pagamento | Uso |
|---|---|---|---|
| local | Supabase CLI (Docker) | sandbox MP | desenvolvimento |
| preview/staging | projeto Supabase Free nº 2 | sandbox MP | revisão de PR |
| produção | projeto Supabase principal | produção MP | clientes |

## 9. Escalabilidade e expansão
- **Multiunidade:** `locations` (horta, cozinha, centro de distribuição) e `stock_levels` por `(product, location)` desde o dia 1. Hoje existe 1 local.
- **Multirregião:** `delivery_zones` com dias e taxas próprias; produto pode ser restrito a zonas.
- **Fornecedores/parceiros:** `producers` e `partners` separados de `products`.
- **App nativo:** PWA agora; Capacitor depois, reaproveitando a mesma base. Nenhuma lógica depende de recurso exclusivo de navegador.
- Gargalo previsível é a operação, não a infraestrutura: o plano gratuito comporta milhares de pedidos por mês.

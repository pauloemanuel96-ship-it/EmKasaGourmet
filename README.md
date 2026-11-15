# Emkasa Gourmet — Plataforma

Plataforma digital da Emkasa Gourmet: loja (horta, cozinha, produtos próprios), painel operacional da Chef Angela
e base para BOX, assinaturas, Escola e Clube.

> **Status:** Sprint 1 em andamento. Tarefas 1 a 7 concluídas (app, CI, Supabase, schema de catálogo/estoque/auditoria).

## Documentação
| Arquivo | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Regras permanentes para o agente de desenvolvimento |
| [docs/BUSINESS_OVERVIEW.md](docs/BUSINESS_OVERVIEW.md) | Empresa, unidades de negócio, público, oportunidades |
| [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Requisitos, jornadas, regras de negócio |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Arquitetura, fluxos críticos, integrações, backup |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Entidades, estoque, pedidos, BOX, assinaturas |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Direção visual, tokens, componentes |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases, critérios de conclusão, Sprint 1 |
| [docs/SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) | LGPD, RLS, alergênicos, pagamentos |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisões técnicas e alternativas |
| [docs/PENDENCIAS.md](docs/PENDENCIAS.md) | O que falta da empresa |

## Estrutura (a partir do Sprint 1)
```
emkasa-gourmet/
├── CLAUDE.md
├── README.md
├── docs/
├── src/
│   ├── app/
│   │   ├── (loja)/            # home, catálogo, produto, carrinho, checkout, institucional
│   │   ├── (admin)/admin/     # hoje, produtos, estoque, pedidos, entregas, auditoria
│   │   └── api/webhooks/      # mercadopago
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   ├── loja/
│   │   └── admin/
│   ├── modules/               # regras de negócio por domínio
│   │   ├── catalogo/
│   │   ├── estoque/
│   │   ├── pedidos/
│   │   ├── pagamentos/
│   │   ├── entregas/
│   │   └── auditoria/
│   ├── services/              # integrações externas (mercadopago, claude, whatsapp)
│   ├── lib/                   # supabase (server/browser), env, utils, zod
│   └── types/                 # tipos gerados do banco (supabase gen types)
├── supabase/
│   ├── migrations/
│   ├── seed.sql               # somente [DEMO]
│   └── config.toml
├── tests/
│   ├── db/                    # migrations + RLS + estoque (PGlite)
│   ├── unit/
│   └── e2e/
├── scripts/                   # importar CSV de produtos, backup
├── .github/workflows/         # ci.yml, backup.yml
└── public/                    # manifest, ícones
```

## Desenvolvimento (Sprint 1 em diante)
Requisito: Node.js 22 ou superior.

```bash
npm install
npm run dev          # http://localhost:3000
npm test
npm run lint
npm run typecheck
```

## Primeiro acesso ao painel

1. Supabase → **Authentication → Sign In / Providers**: desligue *Allow new users to sign up* (o painel não tem cadastro aberto).
2. Supabase → **Authentication → URL Configuration**: *Site URL* = endereço do site; em *Redirect URLs* inclua `http://localhost:3000/auth/callback` (e o endereço de produção quando houver).
3. Supabase → **Authentication → Users → Add user → Create new user**: e-mail da pessoa, marque *Auto Confirm User*.
4. Supabase → **SQL Editor**: dar o papel (troque o e-mail):
   ```sql
   insert into public.staff_roles (user_id, role)
   select id, 'owner' from auth.users where email = 'email@exemplo.com';
   ```
5. Acesse `/admin/login`, informe o e-mail e abra o link **no mesmo navegador**.

Papéis: `owner`, `admin`, `operacao`, `atendimento` (ver docs/SECURITY_AND_PRIVACY.md §1).

Banco: as migrations ficam em `supabase/migrations` e são aplicadas no projeto remoto com `npx supabase db push --remote` (ver docs/ROADMAP.md).

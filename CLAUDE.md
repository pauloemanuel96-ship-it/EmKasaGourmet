# CLAUDE.md — Emkasa Gourmet

Contexto permanente do projeto. Leia este arquivo inteiro antes de qualquer tarefa.
Detalhes ficam em `/docs`. Em caso de conflito, `docs/DECISIONS.md` prevalece.

## O que é
Plataforma digital da Emkasa Gourmet (alimentação saudável, Chef Angela Acioli).
Não é uma marmitaria nem um hortifruti: é um HUB de alimentação e cuidado para o lar.
Slogan conceitual: "Alimentar é uma forma de cuidar."

## Princípio que decide empates
Visão de grande negócio, com o **menor custo e a menor complexidade operacional possíveis**.
Na dúvida entre duas soluções, escolha a mais simples de operar pela Chef Angela.

## Stack (ver DECISIONS.md)
Next.js 16 (App Router) + TypeScript estrito · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, Storage, RLS)
· Mercado Pago (Checkout Pro) · Claude API (assistente operacional, Fase 3) · PWA.
Hospedagem: desenvolvimento na Vercel Hobby, e produção conforme a D-003. n8n e Capacitor ficam fora do MVP.

## Fase atual
**Fase 0 → Fase 1** (ver `docs/ROADMAP.md`). Não implemente módulos de fases futuras.
BOX, assinaturas, Minha Casa, Escola, Clube e Parceiros são **apenas modelados**, não construídos.

## Regras inegociáveis
1. Não inventar dados da empresa: preços, produtos, prazos, regiões, políticas. Dado faltando → `docs/PENDENCIAS.md`.
2. Dado de demonstração só no `supabase/seed.sql`, sempre com prefixo `[DEMO]` no nome.
3. Nenhum segredo no frontend. Só `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são públicas.
4. RLS ligado em **todas** as tabelas. Tabela nova sem policy = PR rejeitado.
5. Validação no servidor com Zod em toda Server Action e Route Handler.
6. Estoque só muda por `inventory_movements` (livro-razão). Nunca dar `UPDATE` direto no saldo.
7. Operações de pedido, pagamento e estoque rodam em transação (funções Postgres), com `SELECT ... FOR UPDATE`.
8. Dinheiro em centavos (`integer`). Quantidade em `numeric(12,3)`.
9. Alergênicos e restrições são lógica **determinística** no banco. A IA nunca decide se algo é seguro.
10. A IA propõe; o sistema valida; a pessoa confirma; o banco registra. O assistente nunca altera preço, ingrediente ou alergênico sem confirmação explícita.
11. Não usar a palavra "orgânico" comercialmente sem certificação validada (ver SECURITY_AND_PRIVACY.md §6).
12. Rótulos como "fit", "low carb" e "sem glúten" só valem com ficha técnica aprovada.
13. Toda alteração administrativa gera `audit_log`.

## Como trabalhar
- Um módulo por vez. Antes de codar, confirme qual tarefa do sprint está em andamento.
- Antes de adicionar dependência: justifique em DECISIONS.md. Prefira o que Next/Supabase já resolvem.
- **Next.js 16 tem mudanças incompatíveis com versões antigas.** Leia `AGENTS.md` e consulte `node_modules/next/dist/docs/` antes de usar uma API do Next.
- Gerenciador de pacotes: **npm** (Node 22+). Fontes são self-hosted via `next/font/local` + `@fontsource-variable`.
- Ao concluir uma funcionalidade: `npm run lint && npm run typecheck && npm test && npm run build`, conferir mobile (360px),
  conferir acessibilidade (teclado, contraste, labels) e atualizar a documentação afetada.
- Commits pequenos, por funcionalidade, em português: `feat(catalogo): ...`, `fix(estoque): ...`.
- Migrations SQL versionadas em `supabase/migrations`. Nunca alterar migration já aplicada.
- Ao faltar informação: registrar em PENDENCIAS.md e seguir com o que for possível.

## Estrutura
```
src/app/(loja)       páginas públicas
src/app/(admin)      painel /admin (protegido)
src/modules/<mod>/   regras de negócio por domínio (catalogo, estoque, pedidos, entregas, assistente…)
src/lib/             clientes (supabase server/browser), utils, validação
supabase/migrations  schema + RLS + funções
tests/               unitários (Vitest) e e2e (Playwright)
```
Páginas não falam direto com tabelas complexas: chamam funções de `src/modules/*`.

## Idioma
Código, tabelas e variáveis em inglês. Interface, commits e documentação em português do Brasil.

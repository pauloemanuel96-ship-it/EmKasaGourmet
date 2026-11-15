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

### Revisão de 15/11/2026 (D-022)
A ordem abaixo substitui a tabela acima onde houver conflito. Critério de passagem igual: a Chef usa sozinha por uma semana.

| Etapa | Módulos, na ordem |
|---|---|
| **Agora: vender de verdade** | 1. ✅ Fundação visual, PWA e correções de exposição de dados · 2. Catálogo e produto lendo do banco + cadastro no painel · 3. Tela "Hoje" real · 4. Pedidos, entregas e Mercado Pago · 5. Conta do cliente, políticas, backup e MFA → **LANÇAMENTO** |
| **3 meses: a casa e o cuidado** | 6. Minha Casa real (perfis, consentimento) · 7. Envie seu plano (D-021) · 8. BOX e assinatura com janela de edição · 9. Push do PWA e WhatsApp de status · 10. Assistente da Chef com IA no painel · 11. Lote, colheita e QR · 12. Indicação · 13. Planejador por regras |
| **Visão** | Nutricionistas parceiras (D-025) · Escola em vídeo · B2B · Clube · Assistente no WhatsApp e atendimento · Foto de despensa e de prato |

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
- [ ] Testes de banco (estoque e RLS) passando; Lighthouse mobile ≥ 90 em Performance e Acessibilidade
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
| 1 | ✅ Criar app Next.js 16 + TS strict + Tailwind 4 + ESLint/Prettier + Vitest (shadcn/ui entra junto com o primeiro componente do painel) | `npm run dev` e `npm test` ok |
| 2 | ✅ GitHub Actions: lint, typecheck, format, test, build | CI verde no PR |
| 3 | ✅ Supabase CLI + projeto remoto (`zzyrperrbmbcnrtrcmkm`, East US: ver D-019); clientes server/browser; `.env.example` | `db push` aplicado |
| 4 | ✅ Migrations 0001–0002: base, catálogo, mídia | tabelas + RLS (leitura pública só de `active`) |
| 5 | ✅ Alergênicos, ingredientes (com derivados), trigger e invalidação; regra do "orgânico" | testes em `tests/db` |
| 6 | ✅ Migration 0003: livro-razão, saldos, `register_stock_movement`, `v_product_availability` | teste: saldo nunca negativo |
| 7 | ✅ `staff_roles`, `has_role()`, `audit_log`, `settings` (na 0001) + dados de referência (0004) | teste de RLS por papel |
| 8 | ✅ Auth do painel (link mágico, sem cadastro aberto) + `proxy.ts` + checagem de papel no servidor | usuário sem papel vê "Sem acesso" |
| 9 | Tokens do DESIGN_SYSTEM no Tailwind, fontes via `next/font`, layout base da loja e do painel | página de estilo `/dev/ui` (apenas em dev) |
| 10 | Painel: lista e formulário de produto (sem fotos ainda) | criar/editar produto com auditoria |
| 11 | Loja: catálogo e página de produto lendo do banco | navegável no celular |
| 12 | Seed `[DEMO]` + importação da lista real de produtos (CSV → script) | catálogo real carregado |

**Fora do Sprint 1:** carrinho, pagamento, entregas, IA, BOX.
**Próximo (Sprint 2):** upload de fotos, tela "Hoje", busca, home editorial, histórico de estoque.

### Módulo 2 dividido em duas entregas (15/11/2026)
**2a ✅ Banco (migration 0006):** árvore de categorias com os nomes da Emkasa, canal loja/encomendas, unidades de venda extras, produto sob orçamento, campanhas (Natal, Ano-Novo, Páscoa, Dia das Mães, Eventos corporativos: desligadas e sem datas), grupos de filtro de alergênicos, rótulos incompatíveis, views `v_store_categories` e `v_store_catalog`, funções de gravação do painel e 19 testes.

**2b ⏳ Telas, em patches pequenos:**
- ✅ **2b.1 Painel: Produtos e Categorias.** `src/modules/catalogo` (tipos, árvore, Zod, leituras do painel e Server Actions chamando `admin_save_product`, `admin_save_category`, `admin_set_product_status` e `validate_product_allergens`, com `updateTag('catalogo')`). Telas `/admin/produtos` (lista com busca e filtros, novo, editar com ficha técnica, rótulos, campanhas e validação da ficha) e `/admin/categorias` (árvore, nova, subcategoria, editar, ativar/desativar). Operação cria rascunho; administração edita e publica.
- ✅ **2b.2 Painel: Ingredientes, Campanhas e Configurações (WhatsApp).** Auditoria em `docs/COMPLETE_PROJECT_AUDIT.md`.
- ⏳ 2b.3 Loja lendo do banco (`use cache` + `cacheTag('catalogo')`, D-031) e dados DEMO com os nomes reais.
- ⏳ 2b.4 Página `/encomendas` com aba em destaque.
- ⏳ 2b.5 Visual leve.

Plano detalhado original:
1. `src/modules/catalogo`: tipos, leitura pública com `use cache` + `cacheTag('catalogo')`, reserva de demonstração (D-031), Server Actions com Zod chamando as funções da D-029 e `updateTag('catalogo')`.
2. Painel: Produtos (lista e formulário com categoria, unidade, preço ou sob orçamento, disponibilidade, época, ingredientes, "pode conter", rótulos com evidência, campanhas, validar ficha), Categorias (criar, editar, ativar/desativar, subcategorias), Ingredientes, Campanhas, WhatsApp de atendimento em `settings`.
3. Dados de demonstração com as categorias e os nomes reais informados pela Emkasa; preço, unidade e estoque marcados DEMO; sem ingredientes nem ficha validada inventados; variedades de exemplo marcadas `[DEMO]`. Ajustar BOX, receitas, clube e testes do assistente que hoje usam produtos inventados.
4. Loja por categoria (seções = categorias-raiz, subcategorias como filtros), página do produto e nova página `/encomendas` com as duas linhas de ceia em destaque, as demais ocasiões, campanhas e pedido de orçamento (pelo WhatsApp quando o número estiver cadastrado; sem guardar dados pessoais). Aba "Encomendas" em destaque no menu e no centro da barra inferior.
5. Visual leve: fundo mais claro, verde-oliva do logo nos botões, a fita amarelo-laranja do K como único gesto gráfico, ilustrações em traço por categoria no lugar de foto, botão "+" no cartão, pílula flutuante do carrinho, transição do cartão para a página do produto (`ViewTransition` do React 19.3).

**Fica para depois de 2b:** fotos (bucket no Storage e envio pelo painel), tela Hoje real com saldo, pedido de orçamento gravado no banco (depende da política de privacidade).


## Novas frentes (pedido do Paulo, 15/11/2026)

Incorporadas depois da auditoria. Ordem: primeiro o que faz a loja vender de verdade e ficar bonita, depois as frentes novas.

1. **2b.3 Loja lendo do banco** + **2b.4 Encomendas e Confraternizações** (já planejadas).
2. **Mídia:** bucket `produtos` no Supabase Storage, fotos no cadastro do produto (principal, galeria, embalagem, composição), Biblioteca de Mídia, importação em lote por nome de arquivo/slug/CSV com tela de revisão (nunca sobrescreve sem confirmar) e `docs/PRODUCT_IMAGE_CATALOG.md` gerado a partir do banco.
3. **Conteúdo editável:** banners (desktop/mobile, período, ordem, pré-visualização) e página **Quem Somos** com a Chef Angela (textos e fotos pelo painel, sem inventar biografia).
4. **Visual premium** (2b.5): fotografia editorial, imagens 3D renderizadas em WebP/AVIF (sem WebGL pesado), microinterações sutis.
5. **Assistente com IA de verdade:** ferramentas reais sobre o banco, três níveis de permissão (consulta, operação simples, sensível com confirmação), memória operacional separada dos dados oficiais, camada de provedores intercambiáveis (OpenAI, DeepSeek e outros, com fallback e limite de gasto). Comparativo de preços feito no dia da escolha.
6. **BOX e assinatura** (Solo, Dupla, Família, Livre; semanal ou quinzenal; pausar e trocar).
7. **Embalagens:** como produto adicional, custo operacional ou retornável com caução (caução só depois de regras definidas).
8. **Emkasa Verde (Plantas e Mudas):** já dá para criar como categoria no painel; depois, variedades e tamanhos.
9. **Emkasa Solidário:** contribuição por unidade separada da receita, campanhas com meta, arrecadado × entregue sem misturar, prestação de contas pública. Sem cobrança real enquanto o checkout for demonstração.

# Auditoria completa do projeto — Emkasa Gourmet

> Feita em 15/11/2026 sobre o `main` (commit `cdb2af5`), lendo o código, as 6 migrations e a documentação.
> O banco de produção **não** foi acessado: tudo sobre o banco vem das migrations e dos testes locais (PGlite).
> Este documento é atualizado a cada entrega. A última seção diz o que já foi corrigido.

## 1. Retrato geral

| Área | Situação real | Observação |
|---|---|---|
| Base técnica (Next 16, React 19, Tailwind 4, Supabase, PWA) | ✅ Sólida | Lint, typecheck, testes e build passam. Cabeçalhos de segurança no `next.config.ts`. |
| Banco: catálogo, alergênicos, rótulos, estoque, auditoria | ✅ Real e testado | RLS em todas as tabelas, funções `admin_*` transacionais, trilha de auditoria com autor. |
| Login da equipe e papéis (owner, admin, operacao) | ✅ Real | `staff_roles` + `StaffGate` + checagem de novo no banco. |
| Painel: Produtos, Categorias, Ingredientes, Campanhas, WhatsApp | ✅ Real (entregas 2b.1 e 2b.2) | Grava no banco pelas funções SQL. |
| Painel: Hoje, Pedidos, Assistente | ⚠️ Demonstração | Dados fictícios guardados no navegador (`src/demo/store.ts`). O aviso no topo diz isso. |
| Loja: home, loja, produto, encomendas | ✅ Lê o banco (2b.3) | Demonstração só sem produto ativo, sempre com selo DEMO. |
| Loja: carrinho, checkout, BOX, clube, Minha Casa, receitas, escola | ⚠️ Demonstração | Checkout sem cobrança; BOX, clube, receitas e escola ainda usam `src/demo`. |
| Checkout / pagamento | ⚠️ Simulado | Sem Mercado Pago. Nenhuma cobrança real é possível hoje (correto). |
| Fotos de produto | ❌ Não existe | Tabela `product_media` existe, mas não há bucket no Storage, upload nem tela. A loja desenha ilustrações (`product-art.tsx`). |
| Banners, Quem Somos, conteúdo editável | ❌ Não existe | Textos da home estão no código. |
| Encomendas e Confraternizações (página pública) | ✅ `/encomendas` (2b.4) | Orçamento pelo WhatsApp configurado no painel. |
| Assistente operacional | ⚠️ Regras fixas | `src/demo/logic.ts` interpreta frases com regras e age só nos dados fictícios. Não usa IA nem o banco. |
| BOX / assinatura, Clube, Solidário, Embalagens, Plantas | ⚠️/❌ | BOX e Clube são telas de demonstração. Solidário e Embalagens não existem. Plantas e Mudas pode ser criada já como categoria. |

## 2. Problemas encontrados e decisão

1. **A loja não lê o banco.** Mesmo com produtos cadastrados no painel, o cliente vê os fictícios. → Próxima entrega (2b.3), seguindo a D-031: o banco manda; a demonstração só aparece quando não há produto real, sempre marcada como DEMO.
2. **Painel com telas de demonstração misturadas com telas reais.** Risco de alguém achar que um pedido fictício é real. → Aviso no topo atualizado. Hoje e Pedidos serão ligados ao banco quando existir a tabela de pedidos (Fase 2); até lá, ficam claramente marcados.
3. **Sem fotos.** É o maior bloqueio visual. → Entrega dedicada: bucket `produtos` no Supabase Storage, upload no produto, Biblioteca de Mídia, importação em lote por nome de arquivo com tela de revisão e geração de `docs/PRODUCT_IMAGE_CATALOG.md` a partir do banco.
4. **Assistente não fala com o banco.** → Será refeito sobre ferramentas reais (consultar produto, mudar disponibilidade, ajustar estoque…), com níveis de permissão e confirmação, e uma camada de provedores de IA intercambiáveis. Antes de escolher provedor, os preços serão consultados no dia (não presumir).
5. **Formulários perdiam o que foi digitado em caso de erro** (comportamento do React 19 com `<form action>`). → Corrigido nos formulários novos (D-032).
6. **Configuração de WhatsApp sem tela.** A chave existia no banco sem forma de editar. → Corrigido: `/admin/configuracoes`.
7. **Segurança — pontos a acompanhar.** CSP completa ainda não existe (só `frame-ancestors`); rate limiting de login e de futuras rotas de IA ainda não existe; não há upload ainda (quando houver: tipos e tamanho limitados por política do bucket). Registrados no roadmap.

## 3. O que está bom e deve ser preservado

- Regras de alergênicos no banco: "contém" calculado pelos ingredientes, "pode conter" manual, validação da ficha que cai quando algo muda, rótulo bloqueado quando contraria a ficha. Nada disso fica só na tela.
- Funções `admin_*` com checagem de papel dentro do banco; operação só cria rascunho.
- Auditoria com autor em toda alteração do painel.
- Identidade "Caderno da Chef" e componentes acessíveis (alvos de 44 px, foco visível, modo escuro).

## 4. Dados fictícios × reais

- **Fictícios:** `src/demo/data.ts` (produtos, receitas, pedidos, clientes, assinaturas), `src/demo/store.ts` (estado no navegador), `src/demo/logic.ts` (regras do assistente).
- **Reais no banco:** estrutura de categorias informada pela Emkasa, alergênicos de referência, rótulos, campanhas sazonais (desligadas). Preços, pesos e ingredientes reais **não foram informados**: nada disso foi inventado.

## 5. Corrigido até agora

| Entrega | O que mudou |
|---|---|
| 2b.1 | Painel de Produtos e Categorias gravando no banco. |
| 2b.2 | Painel de Ingredientes, Campanhas e Configurações (WhatsApp). Auditoria e plano das novas frentes. |
| 2b.3 + 2b.4 | Loja lendo do banco com demonstração marcada; página de Encomendas; filtros recolhidos no celular; título que estourava a tela em 360 px corrigido. |

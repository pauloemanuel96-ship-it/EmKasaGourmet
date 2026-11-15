# DESIGN_SYSTEM — Emkasa Gourmet

> v0.2. Direção aprovada: D-023. Cores `brand-*` medidas no logo oficial (15/11/2026).
> O restante segue **provisório**. A identidade definitiva depende de avaliar o Instagram atual, as embalagens e o logo
> (**[PENDENTE: enviar logo em vetor, fotos e embalagens]**). Os tokens abaixo são o ponto de partida do protótipo.

## 1. Direção
Natural · premium · acolhedora · editorial · humana. "Revista de culinária afetiva", não "loja de suplementos".

**Fazer:** fotos grandes e reais com luz natural; muito respiro; tipografia com personalidade; texto na voz da Chef.
**Evitar:** gradientes, excesso de cards, ícones decorativos, verde-limão "fitness", banco de imagens genérico, cara de dashboard na loja, frases genéricas de IA.

Referências de **negócio** (não visuais): Liv Up, Raízs, Orgânicos in Box, Beleaf, HelloFresh, Riverford.

## 2. Cores (tokens provisórios)
| Token | Hex | Uso |
|---|---|---|
| `--forest-900` | `#1F3A2B` | texto de destaque, header, botão primário |
| `--forest-700` | `#2F5640` | hover, links |
| `--leaf-500` | `#739251` | verde do logo: detalhes, tags de horta, fundos. Não usar em texto pequeno sobre claro (contraste 3,5:1) |
| `--leaf-700` | `#4F6B3A` | texto verde pequeno (sobretítulos): contraste AA sobre o creme |
| `--paper` | `#FFFFFF` | superfície elevada (campos, cartões do painel) |
| `--brand-cream` `--brand-orange` `--brand-yellow` `--brand-red` | `#FFFFAD` `#F9630E` `#FED216` `#DC1601` | cores do logo, uso decorativo |
| `--cream-50` | `#FAF6EE` | fundo principal (papel) |
| `--sand-200` | `#EADFCB` | fundos de seção, divisores |
| `--terracotta-500` | `#B8613D` | acento: preço, CTA secundário, "novo" |
| `--ink-900` | `#1C1B18` | texto corrido |
| `--ink-600` | `#5A5650` | texto secundário |
| `--danger-600` | `#B42318` | erros, **alerta de alergênico** |
| `--warning-600` | `#B54708` | "pode conter", reserva expirando |

**Modo escuro (opcional):** o bloco `[data-theme="dark"]` em `globals.css` troca os valores dos mesmos tokens; componentes não usam classes `dark:`. Nunca usar `bg-white` ou cor fixa em componente: usar `bg-paper`.

Contraste mínimo de 4.5:1 para texto (validar cada par no início do sprint). Alergênico **nunca** é comunicado só por cor: sempre com texto e ícone.

## 3. Tipografia
- **Logotipo:** fonte Diavlo, só como imagem (D-024). Grafia do logo: "emKasa Gourmet".
- **Títulos:** serifada editorial (proposta: *Fraunces*, Google Fonts, variável e gratuita).
- **Texto e interface:** sans humanista (proposta: *Inter* ou *Source Sans 3*).
- Carregar via `next/font` (self-host, sem chamada externa e sem layout shift).
- Escala (rem): 0.75 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.25 · 3 (hero em mobile limitado a 2.25).
- Corpo com 16px mínimo, linha 1.6 e no máximo ~70 caracteres por linha em textos.

## 4. Espaçamento, forma e grid
- Escala de 4px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- Raio: 6px em controles, 12px em imagens. Nada de pílulas em tudo.
- Sombra quase nula; separação por cor de fundo e espaço.
- Grid: 4 colunas no mobile, 8 no tablet e 12 no desktop; conteúdo máximo de 1200px; texto editorial em 680px.

## 5. Breakpoints
`sm 640` · `md 768` · `lg 1024` · `xl 1280`. Projeto pensado a partir de **360px**.

## 6. Componentes (MVP)
| Componente | Notas |
|---|---|
| `ProductTile` | foto 4:5, nome, unidade, preço, estado (Disponível / Esgotado / Sob encomenda). Sem caixa com borda: a foto organiza |
| `ProductGallery` | swipe no mobile, zoom no desktop |
| `AllergenBlock` | "Contém: …" / "Pode conter: …" / "Em revisão", sempre visível na página do produto, nunca em acordeão fechado |
| `DietBadge` | só para rótulos aprovados. Texto curto, sem ícone fantasia |
| `StorageBadge` | ambiente / refrigerado / congelado |
| `QuantityStepper` | alvos de toque ≥ 44px |
| `CartDrawer` | agrupa por conservação; mostra data de entrega escolhida |
| `DeliveryDatePicker` | só dias válidos (RN-06) |
| `WhatsAppButton` | fixo no mobile, sem cobrir CTA de compra |
| `SectionHeader` | serifada + linha de apoio na voz da Chef |
| Admin `TodayList` | linha por produto: foto pequena, nome, saldo, `–` `+`, chave Disponível. Funciona com uma mão |
| Admin `AssistantCard` | proposta de ação com Confirmar / Corrigir (Fase 3) |

## 7. Fotografia
- Fotos reais da Emkasa (pratos, horta, mãos da Chef). Fundo natural (madeira, linho, pedra), luz lateral suave.
- Proporções: produto 4:5, hero 16:9 (desktop) e 4:5 (mobile), receitas 3:2.
- Enquanto não houver fotos: placeholders neutros marcados **[DEMO]**. Nunca usar fotos de concorrentes.

## 8. Voz e microcopy
- Calorosa, simples, direta. "Chegou alface fresquinha hoje" em vez de "Novos produtos disponíveis".
- O assistente fala **pela Emkasa**, nunca como se fosse a Chef Angela.
- Sem promessas de saúde ("emagrece", "cura", "desintoxica").

## 9. Acessibilidade (requisito)
Foco visível · ordem lógica de tabulação · `alt` obrigatório em `product_media` · formulários com `label` · erro descrito em texto ·
`prefers-reduced-motion` respeitado · checagem com axe nos testes e2e.

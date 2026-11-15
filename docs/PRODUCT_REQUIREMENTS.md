# PRODUCT_REQUIREMENTS — Emkasa Gourmet

> v0.1. Requisitos com ID para rastrear nos commits e testes. Prioridade: **M** = MVP · **F** = futuro (somente modelar).

## 1. Personas
- **Cliente (Mariana):** compra pelo celular, quer rapidez, confiança e saber o que vai chegar e quando.
- **Chef Angela (operação):** atualiza disponibilidade todo dia, não quer navegar por menus; quer "falar e pronto".
- **Atendimento/Admin (Paulo ou equipe):** cadastra produtos, acompanha pedidos e entregas.

## 2. Requisitos funcionais

### 2.1 Loja (pública)
| ID | Requisito | P |
|---|---|---|
| RF-L01 | Página inicial: hero, proposta de valor, Horta da semana, Refeições da semana, Produtos próprios, Chef Angela, CTA WhatsApp | M |
| RF-L02 | Catálogo com categorias e filtros (unidade, tipo, conservação, rótulo alimentar aprovado) | M |
| RF-L03 | Busca textual em português, sem diferença de acento (Postgres FTS + unaccent) | M |
| RF-L04 | Página de produto: fotos, descrição, preço, unidade, ingredientes, alergênicos ("contém" / "pode conter"), conservação, validade, origem/produtor | M |
| RF-L05 | Produto esgotado continua visível como "Esgotado", com opção "avise-me" (Fase 2) | M |
| RF-L06 | Carrinho unificado (horta + cozinha + produtos), alertando sobre condições de conservação diferentes | M |
| RF-L07 | Checkout: identificação mínima (nome, WhatsApp, e-mail opcional), entrega ou retirada, zona, data de entrega disponível | M |
| RF-L08 | Pagamento pelo Mercado Pago Checkout Pro (Pix e cartão). O sistema nunca toca em dados de cartão | M |
| RF-L09 | Confirmação do pedido + link para WhatsApp com o resumo do pedido | M |
| RF-L10 | Página "Acompanhar pedido" por número + telefone | M |
| RF-L11 | Páginas institucionais: Sobre / Chef Angela, Como funciona, Entregas, Políticas (troca, privacidade) | M |
| RF-L12 | Receitas ligadas aos produtos ("compre os ingredientes") | F (Fase 2) |
| RF-L13 | Conta do cliente opcional (histórico, endereços) | F (Fase 2) |
| RF-L14 | BOX, Minha Casa Emkasa, assinaturas, cursos, clube | F |

### 2.2 Painel administrativo (/admin)
| ID | Requisito | P |
|---|---|---|
| RF-A01 | Login com e-mail (magic link ou senha) + papéis: `owner`, `admin`, `operacao`, `atendimento` | M |
| RF-A02 | **Tela "Hoje"** (tela inicial da Chef): lista de produtos com botão Disponível/Esgotado e +/– quantidade, em uma tela, no celular | M |
| RF-A03 | CRUD de produtos: dados, fotos, categoria, ingredientes, alergênicos, rótulos, conservação, preço | M |
| RF-A04 | Entrada, saída, perda e ajuste de estoque, sempre com motivo; histórico por produto | M |
| RF-A05 | Pedidos: lista por status e data de entrega, mudança de status, impressão/lista de separação | M |
| RF-A06 | Calendário de entregas: dias de entrega, zonas e taxas, bloqueio de datas ("amanhã não haverá entrega") | M |
| RF-A07 | Log de auditoria consultável (quem, quando, o quê, antes/depois) | M |
| RF-A08 | Dashboard simples: pedidos do dia, a entregar, produtos esgotados, faturamento da semana | M |
| RF-A09 | Assistente operacional por conversa (Fase 3; ver §4) | F (Fase 3) |

## 3. Requisitos não funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Mobile first: tudo funciona a partir de 360px. O painel da Chef é usado no celular |
| RNF-02 | Desempenho: LCP < 2,5 s em 4G, imagens otimizadas (AVIF/WebP), páginas de catálogo com cache/ISR |
| RNF-03 | Acessibilidade WCAG 2.1 AA: contraste, foco visível, navegação por teclado, textos alternativos |
| RNF-04 | Segurança: RLS em todas as tabelas, validação no servidor, segredos só no servidor (SECURITY_AND_PRIVACY) |
| RNF-05 | Consistência: uma única fonte de dados, e disponibilidade alterada reflete em todos os canais na hora |
| RNF-06 | Auditabilidade: toda mudança administrativa e de estoque é rastreável |
| RNF-07 | Custo: infraestrutura em planos gratuitos até haver receita que justifique (ver DECISIONS D-003/D-004) |
| RNF-08 | Recuperação: backup diário do banco fora do Supabase, com restauração testada (ver SYSTEM_ARCHITECTURE §7) |
| RNF-09 | SEO: metadados, Open Graph, schema.org `Product`/`Recipe`/`LocalBusiness`, sitemap |
| RNF-10 | PWA instalável (manifest + ícones). Modo offline completo não está no MVP |

## 4. Assistente operacional (Fase 3, arquitetura definida agora)
Fluxo obrigatório: **mensagem → intenção → entidades → consulta ao banco → ambiguidades → proposta → confirmação → execução por ferramenta → registro → resposta**.

| Mensagem | Intenção | Ação proposta | Confirmação? |
|---|---|---|---|
| "Acabou o tomate." | `set_unavailable` | estoque de Tomate → 0 (motivo: esgotado) | Não, se o produto for único e sem ambiguidade |
| "Chegaram mais 10 alfaces." | `stock_in` | +10 em Alface (crespa? americana? → perguntar) | Só se ambíguo |
| "Temos oito Farofas Nutritivas." | `stock_set` | ajuste para 8 | Sim (ajuste absoluto) |
| "Amanhã não haverá entrega." | `block_delivery_date` | bloquear a data D+1 | Sim |
| "Novo prato: lasanha vegana." | `create_product_draft` | cria **rascunho** sem preço/alergênicos | Sim, e o produto só publica após completar a ficha no painel |
| "Muda o preço da farofa pra 25." | `change_price` | proposta | **Sempre**, com valor antigo → novo |

Ferramentas expostas à IA = funções do servidor com validação própria. A IA nunca recebe SQL nem chave de serviço.

## 5. Jornadas

### J1 — Compra avulsa (MVP)
Instagram/Google → home → catálogo → produto → carrinho → checkout (nome, WhatsApp, zona, data) → Mercado Pago → confirmação + WhatsApp → acompanhamento → entrega.

### J2 — Rotina da Chef (MVP)
Abre /admin no celular → tela **Hoje** → marca o que tem e o que acabou, ajusta quantidades → vê os pedidos da próxima entrega → imprime ou consulta a lista de separação.

### J3 — Semana da Mariana (meta, Fases 4–5)
Domingo informa a casa (3 pessoas, vegetariana) → recebe a sugestão do BOX Família cruzada com o estoque real → adiciona congelados e Farofa → quarta recebe receita com itens da cesta → quinta recebe a entrega → sexta escolhe se repete a composição.

## 6. Regras de negócio
| ID | Regra |
|---|---|
| RN-01 | Não vender estoque inexistente: o pedido reserva o estoque em transação. Sem saldo, o item é recusado com mensagem clara |
| RN-02 | Reserva não paga expira (padrão 30 min **[PENDENTE confirmar]**) e devolve o estoque automaticamente |
| RN-03 | Produto pode ser **sob encomenda** (`stock_mode = made_to_order`): não controla saldo, mas respeita prazo mínimo e limite diário |
| RN-04 | Catálogo ≠ disponibilidade: produto `archived` some da loja, mas mantém histórico; produto `active` sem saldo aparece "Esgotado" |
| RN-05 | Preço no pedido é congelado no `order_items` (snapshot de nome e preço) |
| RN-06 | Data de entrega só pode ser escolhida entre os dias de entrega da zona, respeitando prazo de corte e datas bloqueadas |
| RN-07 | Rótulo alimentar (vegano, sem glúten, low carb…) só aparece com `approved_at` preenchido por alguém com papel `owner`/`admin` |
| RN-08 | Produto sem declaração de alergênicos validada exibe "Informações de alergênicos em revisão" e é **excluído** de qualquer filtro do tipo "sem X" |
| RN-09 | "Pode conter" (contaminação cruzada) bloqueia em filtros de alergia da mesma forma que "contém" |
| RN-10 | Cancelamento após pagamento gera estorno pelo Mercado Pago e devolução de estoque, em transação |
| RN-11 | Valores de frete, pedido mínimo, prazos e políticas vêm da tabela `settings`/`delivery_zones`, nunca fixos no código |

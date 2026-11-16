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
**Trade-off:** SQL é menos familiar que TS, por isso exige teste de banco obrigatório (D-017) para cada função.

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

## D-014 — Fontes self-hosted · **Aceita**
Fraunces e Inter via pacotes `@fontsource-variable/*` carregados com `next/font/local`.
**Por quê:** o build não depende de acesso ao Google Fonts, nenhum dado do visitante vai para o Google (LGPD) e o resultado é o mesmo do `next/font/google`.

## D-015 — npm em vez de pnpm · **Aceita**
O Paulo já usa npm no Windows (`npm.cmd`). Uma ferramenta a menos para instalar. Substitui a menção a pnpm na versão inicial dos documentos.

## D-016 — Visibilidade do repositório · **Proposta**
O repositório `EmKasaGourmet` está **público**. Hoje não há segredos nele, mas os documentos expõem a estratégia do negócio e o schema do banco.
**Recomendação:** torná-lo privado (Settings → General → Danger Zone → Change visibility). Não afeta CI nem deploy.

## D-017 — Testes de banco com PGlite em vez de pgTAP · **Aceita**
As migrations reais rodam num Postgres em memória (`@electric-sql/pglite`) com um stub mínimo do Supabase (`auth.uid()`, papéis `anon`/`authenticated`). Os testes ficam em `tests/db` e rodam no `npm test` e no CI, sem Docker.
**Limite:** não substitui um teste no Supabase real (Auth, Storage, Realtime). Para isso, usar o projeto de staging antes do lançamento.

## D-018 — Chaves novas do Supabase · **Aceita**
Usar a chave publicável (`sb_publishable_...`) no app e a chave secreta (`sb_secret_...`) só no servidor, em vez das chaves legadas `anon`/`service_role`. As secretas podem ser revogadas individualmente.

## D-019 — Região do Supabase · **Proposta (reavaliar antes do lançamento)**
O projeto `zzyrperrbmbcnrtrcmkm` foi criado em East US (Ohio): o plano gratuito não ofereceu São Paulo. Impacto: latência maior e transferência internacional de dados (LGPD). Antes de haver dados de clientes, recriar em `sa-east-1` se a opção estiver disponível (migrations recriam tudo).

## D-020 — Protótipo navegável com dados fictícios · **Aceita**
`src/demo/*` simula catálogo, estoque, pedidos, BOX, assinatura, clube e o assistente, com estado no navegador (localStorage). As regras puras (`src/demo/logic.ts`) têm testes e servem de especificação para a versão real. Cada módulo será trocado pelo Supabase, um de cada vez, e `src/demo` some ao final.

## D-021 — Plano alimentar pode ir à Claude API, com salvaguardas · **Aceita (Paulo, 15/11/2026)**
Altera o SECURITY_AND_PRIVACY §3. Para a funcionalidade "Envie seu plano", o **arquivo** do plano (foto ou PDF) pode ser enviado à Claude API quando o titular dá consentimento específico para essa finalidade.
**Condições:** vai só o arquivo, sem nome, telefone ou endereço; modelo Sonnet (não Fable, que exige retenção de 30 dias); pedir retenção zero à Anthropic se a conta for elegível; a IA só transcreve e propõe itens, o cliente confirma um a um e só então as regras determinísticas do banco passam a filtrar; o arquivo original é apagado após a confirmação, salvo pedido do cliente; Anthropic listada como operadora na política de privacidade.
**Pendente antes de construir:** validação jurídica do termo de consentimento e da transferência internacional. Perfis de saúde e contatos continuam **fora** de qualquer prompt.

## D-022 — Ordem do roadmap revisada · **Aceita (Paulo, 15/11/2026)**
Vender primeiro; IA e saúde depois. Ordem: (1) fundação visual + PWA, (2) catálogo real + painel, (3) tela Hoje, (4) pedidos + entregas + Mercado Pago, (5) conta do cliente, políticas, backup e MFA → lançamento; depois Minha Casa, Envie seu plano, BOX e assinatura, notificações, assistente com IA, rastreabilidade, indicação e planejador. Detalhe no ROADMAP.

## D-023 — Direção visual: "Caderno da Chef" com navegação de app · **Aceita (Paulo, 15/11/2026)**
Editorial nas telas de conteúdo (serifada grande, papel creme, foto real) e gramática de app nas telas de compra (barra inferior no celular, listas, alvos de 44 px). Modo escuro opcional: o padrão é claro e a escolha fica no aparelho. O modo escuro troca os **valores** dos tokens em `[data-theme="dark"]`, sem classes `dark:` nos componentes.

## D-024 — Fonte do logo (Diavlo) não é servida pelo site · **Aceita**
A licença que veio com o logo permite uso comercial e incorporação em arquivos, mas **proíbe distribuir o arquivo da fonte online** sem autorização do autor (Jos Buivenga, exljbris). Servir a fonte como webfont é distribuí-la. O logotipo entra como imagem; títulos seguem em Fraunces. Reavaliar só com autorização por escrito do autor.

## D-025 — Nutricionistas parceiras sem comissão por produto · **Proposta (validar com CRN e advogado)**
O Código de Ética do CFN (Resolução 856/2026), segundo o resumo consultado, veda vincular marca à prescrição individual e receber vantagens de empresas do setor. Modelo de receita: mensalidade da profissional pela agenda ou assinatura premium do cliente. O plano cita alimentos, não produtos; o cruzamento com o catálogo é da plataforma, por regra determinística.

## D-026 — Catálogo em árvore de categorias, com canal · **Aceita (pedido do Paulo, 15/11/2026)**
As categorias de primeiro nível são as seções da loja. `categories.kind` diz o canal da árvore inteira: `loja` (carrinho) ou `encomendas` (página "Encomendas e Confraternizações", com pedido de orçamento). Subcategoria herda canal e área da mãe (trigger). Desativar uma categoria esconde a árvore inteira do visitante sem apagar nada. A árvore inicial usa os nomes informados pela Emkasa e está na migration 0006; produtos **não** foram criados (faltam preço, unidade e ficha).

## D-027 — Variedades são produtos dentro de uma subcategoria · **Proposta**
Cada sabor ou variedade (Blends Veganos, Almôndegas) é um produto próprio dentro da subcategoria. **Por quê:** sabores têm ingredientes diferentes, logo alergênicos, preço e estoque diferentes. Um seletor de sabor na página do produto pode vir depois, sem mudar o banco.

## D-028 — Produto "sob orçamento" · **Aceita**
`products.quote_only` permite ativar um produto sem preço fixo. Usado em Encomendas. Fora disso, produto ativo continua exigindo preço e categoria.

## D-029 — O painel grava por função SQL transacional · **Aceita**
`admin_save_product`, `admin_save_category`, `admin_save_ingredient`, `admin_save_campaign` e `admin_set_product_status` gravam tudo em uma transação e rodam com as permissões de quem chama (o RLS continua valendo). A Server Action só valida com Zod e chama a função. Operação cria rascunho simples; ficha técnica, rótulos, campanhas e publicação são da administração. Testes em `tests/db/catalog.test.ts`.

## D-030 — Grupos de filtro e rótulos incompatíveis · **Aceita (validar com responsável técnico)**
`allergens.filter_group` agrupa para os filtros "sem X": glúten cobre trigo, centeio, cevada e aveia; leite cobre lactose; castanhas cobre cada castanha listada. `diet_label_blockers` impede rótulo que contraria a ficha ("sem glúten" com trigo; "vegano" com leite ou ovos). Na loja, rótulo só aparece se aprovado, com a ficha de alergênicos validada e sem alergênico incompatível.

## D-031 — Demonstração só enquanto não houver produto real · **Aceita (implementada na 2b.3)**
A loja lê `v_store_catalog`. Sem nenhum produto ativo no banco, mostra os dados de demonstração; a partir do primeiro produto ativo, mostra só os reais. Nunca mistura os dois.

## D-032 — Formulários do painel enviam por `onSubmit` · **Aceita**
O React 19 limpa o formulário depois de uma `<form action>`. Num erro de validação a pessoa perderia o que digitou. Os formulários do painel chamam a Server Action por `onSubmit` + `startTransition`, e o servidor continua validando com Zod e com a função SQL. Preço é digitado em reais ("24,90") e convertido para centavos sem ponto flutuante (`parseBRLToCents`).

## D-033 — Fotos no Supabase Storage, convertidas para WebP · **Aceita**
Bucket público `produtos` (5 MB, só imagem). Só a administração envia, troca e apaga (RLS em `storage.objects`); o banco guarda só caminho, texto alternativo e tipo (`product_media`), e `admin_attach_media` confere que o arquivo existe. Upload: o navegador converte para WebP de até 1600 px antes de subir. Link: o servidor só baixa de domínios do GitHub (lista fechada, sem seguir redirecionamento, 20 MB, 20 s) e converte com `sharp`. Importação em lote casa nome de arquivo e produto e nunca escolhe sozinho em caso de dúvida. O assistente põe foto com confirmação e só responde "pronto" depois do banco confirmar.

## D-034 — Abertura 3D da home com three.js, só na vitrine · **Aceita (pedido do Paulo, 15/11/2026)**
A abertura da home vira um palco 3D: a salada no pote se monta com o scroll ("Monte do seu jeito", ingredientes que a pessoa tira e coloca) e depois entra o pote transparente da Farofa Nutritiva de Soja, com o rótulo e a textura tirados das fotos reais. Dependência nova: `three` (e `@types/three`), usada pura, sem React Three Fiber, porque a cena é uma só e assim o pacote fica menor. Regras: (1) o 3D existe **só** na abertura da home; loja, carrinho, checkout e painel continuam sem ele; (2) o código da cena é baixado depois que a página abriu (import dinâmico), então não pesa no primeiro carregamento; (3) sem JavaScript, sem WebGL, com economia de dados ligada ou em aparelho com pouca memória, a mesma seção aparece com texto e fotos reais; (4) aparelho lento perde sombra e resolução automaticamente; (5) "reduzir movimento" desliga a animação contínua. A salada é ilustração e está marcada como tal na tela: ingredientes reais, preços e disponibilidade continuam vindo só do catálogo. Arquivos em `src/components/loja/home-stage/`.

## D-035 — Campanha com página própria e visual próprio: Natal · **Aceita (pedido do Paulo, 15/11/2026)**
Cada campanha sazonal ganha uma página só dela, com identidade visual própria, e uma chamada na home. A primeira é `/natal`: abertura com árvore 3D interativa (girar, tocar nos enfeites, abrir os presentes, trocar as luzes, neve), contagem de dias até 25/12 e o cardápio. O conteúdo vem do catálogo, sem cadastro novo: as ceias são as categorias em destaque de Encomendas, e qualquer produto de Encomendas marcado com a campanha "Natal" no painel aparece na página, agrupado pela categoria dele. Sem prato cadastrado, a página mostra "Cardápio chegando" em vez de inventar. A chamada da home é leve (neve em canvas 2D, sem WebGL) e é ligada por `src/modules/campanhas/home-campaign.ts` até o painel controlar isso. A cena 3D segue as regras da D-034 (carrega depois, tem versão sem 3D, respeita "reduzir movimento"). Arquivos em `src/components/loja/natal/`.

## D-036 — Tela de carregamento e volta ao topo ao atualizar · **Aceita (pedido do Paulo, 16/11/2026)**
Ao entrar ou atualizar (F5), a loja mostra uma tela de carregamento com o logo no centro e três arcos girando nas cores da marca (verde, amarelo e laranja), e a página volta ao topo. A tela vem pronta no HTML e é controlada por um script mínimo dentro do próprio componente, sem esperar o React: fica no mínimo 1,2 s, some quando a página termina de carregar e, se o JavaScript falhar, o CSS a esconde sozinho em 7 s. Não aparece ao navegar entre páginas, só em carregamento completo. Vale para a loja; o painel não usa. Arquivo: `src/components/loja/splash-screen.tsx`.

Na mesma entrega: a árvore de Natal passou a ter ramos com agulhas, neve nos galhos, pinhas, bengalas e laços, e cada presente aberto revela uma ceia ou o botão de encomenda (D-035); na home, os potes ficam sobre uma tábua de madeira com sombra de verdade e o copo ganhou gotinhas de condensação (D-034).

## D-037 — Aviso de ofertas, contatos e origem do visitante · **Aceita (pedido do Paulo, 16/11/2026)**
A loja passa a captar contatos por um aviso que aparece uma vez (9 s depois de chegar ou ao rolar 35% da página; nunca no carrinho, checkout ou pedido). Até 30/11/2026 ele fala da Black Friday Emkasa; depois vira "Descontos e promoções" sozinho (data e textos em `src/modules/leads/popup-config.ts`). Fechar adia por 7 dias; cadastrar encerra.

Regras: (1) só grava com a caixa de consentimento marcada, e o texto aceito e a hora ficam guardados (LGPD); (2) o visitante grava pela função `capture_lead` e não lê nada; só owner e admin leem e apagam, e apagar fica na auditoria; (3) o mesmo e-mail atualiza o cadastro em vez de duplicar; (4) a origem do primeiro acesso (UTM, clique de anúncio do Google ou da Meta, site de origem, página de entrada) fica só no navegador da pessoa e só vai ao servidor junto com um cadastro que ela enviou. Painel: `/admin/leads` (Contatos), com exportação em CSV.

Fica de fora de propósito, para as próximas entregas: envio automático de cupom, pixels de anúncio e registro de visitas de quem não se cadastrou. Os três dependem de aviso de cookies com consentimento (ver PENDENCIAS).

## D-038 — Home em momentos: BOX na abertura, um 3D por etapa da jornada · **Aceita (decisão delegada pelo Paulo, 16/11/2026)**
A abertura deixava de combinar com o próprio botão: dizia "Montar meu BOX" e mostrava um pote de salada vazio, e a pessoa precisava rolar cinco telas presas no 3D antes de ver qualquer produto ou a chamada de Natal. Agora cada 3D aparece no ponto da página em que ajuda a vender: (1) abertura com a caixa do BOX se enchendo de frutas e verduras, ao lado do botão do BOX; (2) chamada da campanha; (3) como funciona; (4) Farofa em 3D abrindo as vitrines de produtos; (5) salada "Monte do seu jeito" depois das vitrines; depois Encomendas e o resto. O scroll volta a ser normal, sem tela presa. Cada cena é independente: só é baixada e criada quando chega perto da tela, anima quando aparece e para quando sai. Substitui o palco único da D-034; as regras de lá continuam (carrega depois, foto de reserva, aparelho fraco, "reduzir movimento").

## D-039 — SEO de base, sem atalhos · **Aceita (16/11/2026)**
Entraram: endereço canônico e metadados de compartilhamento, dados estruturados (schema.org) da empresa na home e de cada produto real na página dele, `sitemap.xml` gerado do catálogo e `robots.txt` liberando a loja e fechando painel, carrinho, checkout, pedido e Minha Casa. Produto de demonstração fica fora do sitemap, sem dados estruturados e marcado para não indexar; oferta com preço só aparece em produto à venda. Não entra texto escondido nem lista de palavras-chave: o Google trata como spam. O endereço do site vem de `NEXT_PUBLIC_SITE_URL` ou, na falta, do endereço de produção da Vercel.

## D-040 — O scroll conduz a salada e a Farofa, sem prender a tela · **Aceita (pedido do Paulo, 16/11/2026)**
Na D-038 as cenas passaram a andar sozinhas ao entrar na tela, e o Paulo sentiu falta de o movimento acompanhar o scroll. Agora a salada se monta e a Farofa abre conforme a seção sobe na tela (do momento em que desponta embaixo até chegar ao meio), e desmontam ao rolar de volta. A tela continua rolando normalmente: não há trecho preso. A caixa do BOX segue enchendo sozinha, porque já abre a página visível, e gira um pouco conforme a pessoa rola. A salada trocou de lugar com a Farofa: fica antes das vitrines, e a Farofa depois delas.

## D-041 — Abertura com vídeo real da horta ao prato · **Aceita (pedido do Paulo, 16/11/2026)**
A caixa do BOX em 3D saiu da abertura: o Paulo quer a página com mais cara de coisa natural e enviou um vídeo (horta, colheita, lavagem, preparo e prato). A abertura passa a ser esse vídeo atrás do texto, sem som e em laço. Do vídeo de 69 s foi montado um laço de 15 s com as cinco cenas e transição suave, em três tamanhos: celular (recorte vertical, 1,5 MB), 720p (2,9 MB) e 1080p (5,2 MB, só em telas largas). Regras: a primeira imagem aparece na hora e o vídeo entra quando carrega; fora da tela ele pausa; há botão de pausar; com "reduzir movimento" ou economia de dados fica só a imagem. GIF não é usado: pesa dezenas de vezes mais e tem qualidade pior. O 3D continua na salada e na Farofa (D-040); o código da caixa do BOX ficou guardado na cena para a página do BOX. Arquivos em `public/video/` e `src/components/loja/hero-video.tsx`.

## D-042 — Conta do cliente e endereços da família · **Aceita (pedido do Paulo, 16/11/2026)**
A loja passa a ter conta de cliente: criar conta com e-mail e senha, entrar, pedir senha nova, alterar nome, celular e a opção de receber ofertas, e cadastrar endereços. A conta guarda até 10 endereços, cada um com um nome dado pela pessoa (casa, trabalho, casa da mãe, do pai, do filho) e quem recebe; um deles é o principal. O CEP preenche rua, bairro, cidade e estado (ViaCEP, gratuito) e a pessoa ajusta à mão. Tudo fica no topo da Minha Casa; o restante daquela página continua demonstração.

Segurança: cada pessoa lê e altera só a própria conta e os próprios endereços (RLS); owner e admin leem; operação e atendimento não; o e-mail da conta vem do login e a pessoa não consegue trocá-lo pela tabela. Abrir o cadastro não expõe nada novo do catálogo: as regras que liberam leitura a "qualquer logado" já eram públicas. Cliente logado que tentar abrir o painel cai na tela "sem acesso", como qualquer usuário sem papel. As mensagens de cadastro e de senha não revelam se um e-mail já tem conta. Painel: `/admin/clientes`.

Depende de duas configurações no Supabase que só o Paulo faz: abrir o cadastro com confirmação de e-mail e cadastrar um remetente próprio. Sem a primeira, a tela mostra "O cadastro ainda não está aberto".

## D-043 — Família da conta e dado de saúde só do dono · **Aceita (pedido do Paulo, 16/11/2026)**
A conta passa a guardar as pessoas da casa (até 12): nome ou apelido, quem é, ano de nascimento, o que gosta e não gosta, dieta, o que não pode comer (da lista oficial de alergênicos) e objetivo alimentar. Fica na Minha Casa, acima dos endereços.

Dieta, alergia e objetivo são dado pessoal sensível (LGPD art. 11), e muitas vezes de criança. Regras, conferidas pelo banco: (1) só entram com autorização registrada (texto aceito e data na tabela `consents`), pedida no próprio formulário na primeira vez; (2) **só o dono da conta lê**: não existe regra de leitura para a equipe, nem para owner; (3) retirar a autorização apaga dieta, alergias e objetivo de todos na hora e mantém nomes e gostos; (4) nada disso vai para IA nem para marketing. As tabelas ficam no schema `public` com RLS só-do-dono, e não no schema `private` que o SECURITY_AND_PRIVACY previa: no `private` cada leitura precisaria de uma função com privilégio elevado, o que aumenta a superfície sem ganho, já que quem lê é sempre a própria pessoa logada.

Guarda-se o ano de nascimento em vez da idade (a idade muda sozinha). Peso não é coletado: sem uso definido, seria dado de saúde guardado à toa.

## D-044 — "Serve para a minha casa?": a loja confere cada produto com a família · **Aceita (16/11/2026)**
Os perfis da D-043 passam a trabalhar. Para quem está logado e cadastrou a família: na página do produto, o "Raio-X da sua casa" mostra, pessoa por pessoa, se o produto serve, não serve ou está em dúvida, com o motivo; na loja, cada produto real ganha um selo e há um filtro "Só o que serve para a minha casa".

Quem decide é o banco (`household_fit`), com regra fixa pela ficha do produto, nunca IA: (1) contém ou **pode conter** algo que a pessoa não pode: não serve; (2) a pessoa tem restrição e a ficha de alergênicos ainda não foi validada: dúvida, nunca "serve"; (3) a dieta só conta como atendida com selo aprovado (vegano atende vegetariana). Alergênicos que andam juntos são cruzados nos dois sentidos pela tabela `allergen_groups`: glúten com trigo, centeio, cevada e aveia; castanhas com cada castanha. Item de demonstração não recebe selo e sai do filtro, porque não tem ficha de verdade. "Gosta" e "não gosta" ainda não entram na conta. O resultado é só da própria conta: a equipe não vê.

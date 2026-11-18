# PENDENCIAS — informações que precisamos da Emkasa

> Nada abaixo deve ser inventado no código. Responder e mover para a doc correspondente.
> Prioridade: 🔴 bloqueia a Fase 1 · 🟠 bloqueia o lançamento (Fase 2) · ⚪ futuro.

## Operação
- 🔴 Cidade(s) onde a Emkasa opera hoje e onde ficam a horta e a cozinha.
- 🔴 **Lista de produtos atual**: nome, unidade de venda, preço, categoria (planilha serve; existe modelo de CSV no Sprint 1).
- 🔴 Para cada prato/produto próprio: ingredientes e alergênicos ("contém" e "pode conter").
- 🔴 Quem vai operar o painel no dia a dia (Chef, outra pessoa?) e o e-mail de cada um.
- 🟠 Dias de entrega, horários, bairros/zonas atendidas, taxa por zona e pedido mínimo.
- 🟠 Prazo de corte (até quando pedir para entregar no dia X).
- 🟠 Retirada no local? Endereço e horários.
- 🟠 Tempo de reserva do carrinho não pago (sugestão: 30 min).
- 🟠 Encomendas: prazo mínimo e limite diário por item.
- ⚪ Fornecedores e produtores parceiros; certificações.

## Marca e conteúdo
- ✅ Logo recebido em 15/11/2026 (PNG e PSD) e aplicado nos ícones do app. 🟠 Ainda falta a versão em **vetor** (SVG/AI/PDF) para impressão e tamanhos grandes.
- 🟠 Fonte do logo (Diavlo): a licença não permite servir o arquivo no site (D-024). Se quiserem a fonte nos títulos, pedir autorização ao autor.
- 🔴 Fotos reais de produtos, pratos, horta e da Chef (mesmo de celular, desde que com boa luz).
- 🟠 Texto "Sobre / história da Chef Angela", aprovado por ela.
- 🟠 Depoimentos reais com autorização de uso.
- ⚪ Embalagens atuais (fotos) para orientar a identidade.

## Legal e regulatório (validar com profissional)
- 🟠 CNPJ/razão social para rodapé, políticas e Mercado Pago.
- 🟠 Licença sanitária (alvará da vigilância) cobrindo venda e entrega dos produtos.
- 🟠 Rotulagem de produtos embalados (Farofa, Blends): rotulagem nutricional e de alergênicos conforme ANVISA.
- 🟠 Uso de "orgânico": situação de cada produtor (certificado, OCS ou nenhum).
- 🟠 Nota fiscal: emite hoje? Por qual sistema? (Define se precisamos de CPF no checkout.)
- 🟠 Política de troca, cancelamento e reembolso para alimentos perecíveis.
- 🟠 Política de privacidade (texto final validado).

## Contas e acessos
- 🔴 Repositório GitHub (sugestão: `emkasa-gourmet`, privado, na conta `pauloemanuel96-ship-it`).
- 🔴 Conta Supabase (região São Paulo).
- 🟠 Conta Mercado Pago da Emkasa (PJ, de preferência) + credenciais de teste e produção.
- 🟠 Domínio (`emkasagourmet.com.br`? verificar disponibilidade no Registro.br).
- 🟠 Número de WhatsApp oficial de atendimento.
- ⚪ Conta na Anthropic API (Fase 3).

## Negócio (Fases 4+)
- ⚪ Composição e preço-base de cada BOX; política de substituição.
- ⚪ Interesse real em B2B: há empresas para testar um piloto?
- ⚪ Cursos: formato, preço, gravação.

## Catálogo (lista recebida em 15/11/2026)
- ✅ Categorias e nomes de produtos informados. A árvore de categorias já está no banco.
- 🔴 Para cada produto da lista: unidade de venda, preço, ingredientes e "pode conter". Sem isso ele não pode ser publicado.
- 🔴 Sabores dos Blends Veganos e variedades das Almôndegas.
- 🟠 Cardápio das ceias (Natural e Tradicional): pratos, combos, para quantas pessoas servem, preço ou "sob orçamento".
- 🟠 Datas e prazo de encomenda de cada campanha (Natal, Ano-Novo, Páscoa, Dia das Mães, Eventos corporativos).
- 🟠 Épocas (meses) dos itens da Horta e Naturais.
- ⚪ O fim da mensagem com a lista chegou cortado em "Antes de implementar, analisar a…": reenviar o trecho final.

## Abertura 3D da home (15/11/2026)
- 🟠 Ingredientes da salada no pote: a ilustração usa molho, grão-de-bico, cenoura ralada, repolho roxo, pepino, brócolis, alface e tomate-cereja. Confirmar a lista real (ajuste em `src/components/loja/home-stage/ingredients.ts`).
- 🟠 "Monte do seu jeito": hoje é só a ideia na vitrine. Definir se a salada personalizada vira produto de verdade (opções, preço, como pedir).
- ⚪ Rótulo da Farofa: há duas versões nas fotos (faixa laranja e faixa vermelha) e o pote 3D mostra uma de cada lado. Informar qual é a atual.

## Natal (15/11/2026)
- 🔴 Pratos das ceias e avulsos (entradas, principais, sobremesas): cadastrar no painel em Encomendas e marcar a campanha "Natal". Sem isso a página mostra "Cardápio chegando".
- 🔴 WhatsApp oficial: sem o número, o botão de encomenda aparece como "Encomendas abrem em breve".
- 🟠 Prazo final de encomenda e formas de retirada ou entrega do Natal.
- ⚪ Ligar e desligar a chamada da home pelo painel (hoje é uma linha em `src/modules/campanhas/home-campaign.ts`).

## Frentes pedidas em 16/11/2026 (ordem sugerida de construção)
Cada item é um módulo. O de cima destrava os de baixo.
1. ✅ **Conta do cliente (construída em 16/11, D-042):** criar conta, entrar, senha nova, dados e endereços da família. Para funcionar em produção falta o Paulo abrir o cadastro e configurar o remetente de e-mail no Supabase (ver seção abaixo). Ainda não entrou: "usar minha localização", apagar a própria conta pelo site e a confirmação do endereço na compra (vem com o carrinho de verdade).
2. 🔴 **Carrinho e pedido de verdade no banco.** Hoje carrinho, checkout e pedidos são demonstração guardada no navegador. Com isso vêm carrinho abandonado e item que entrou e saiu do carrinho.
3. 🔴 **Pagamento real** (conta Mercado Pago da empresa; hoje é teste).
4. 🟠 **Cupons e descontos.** O aviso de ofertas promete desconto, mas ainda não existe cupom no sistema. Definir os descontos da Black Friday (percentual, produtos, validade).
5. ✅ **Aviso de cookies com consentimento (construído em 16/11, D-045):** necessários, medição e anúncios, com reabertura pelo rodapé. Falta: página de política de privacidade e cookies com texto validado (ver Legal).
6. ✅ **Registro de visitas e funil (construído em 17/11, D-047):** Radar da loja em Painel → Tráfego, só para o dono: visitantes, origem, aparelho, funil, carrinho abandonado, itens que entraram e saíram do carrinho e últimas visitas. Falta: o pedido final do funil vira real com o carrinho de verdade; aviso por e-mail ou WhatsApp para carrinho abandonado (precisa de ferramenta de disparo).
7. ✅ **Painéis por papel (feito em 17/11, D-048):** cada papel vê só o seu menu; o dono vê também o Tráfego. Falta: tela de financeiro para a administração, que depende dos pedidos de verdade.
8. 🟠 **Integração Google Ads e Meta Ads** (conversões pelo servidor). Precisa das contas de anúncio.
9. ✅ **SEO (base feita em 16/11, D-039):** metadados, dados estruturados de empresa e produto, sitemap e robots. Falta: cadastrar o site no Google Search Console e enviar o sitemap (precisa da sua conta Google), imagem de compartilhamento própria (hoje usa o logo) e textos de descrição dos produtos reais.
10. ✅ **Família na Minha Casa (construída em 16/11, D-043):** cada pessoa com quem é, ano de nascimento, o que gosta e não gosta, dieta, o que não pode comer e objetivo, com autorização de saúde. O BOX já usa esses perfis para quem está logado (D-046). Falta: foto de perfil ou da família; peso, que ficou de fora até haver um uso definido.
11. 🟠 **Assistente do cliente** (botão flutuante) com IA: ajuda na compra e pode propor o cadastro de um familiar, que a pessoa confirma. Precisa da chave da API e de limite de custo por mês.
12. ⚪ **Plantas, mudas e flores sob encomenda.** Entra como uma seção da loja com pedido por orçamento, igual a Encomendas. Definir nome (evitar "Mundo Verde", que é marca de uma rede de lojas), produtos, fotos e preços.
13. ⚪ Envio das ofertas aos contatos (e-mail e WhatsApp): escolher a ferramenta de disparo. Hoje o cadastro só guarda o contato.

## Conferências que o Paulo vai fazer depois (16/11/2026)
- ⚪ Abrir `emkasa-gourmet.vercel.app/sitemap.xml` e ver se os endereços aparecem com o domínio do site, e não com "localhost".
- ⚪ Testar o aviso de ofertas em aba anônima: cadastrar um e-mail de teste e ver se ele aparece em Contatos no painel.

## Conta do cliente: o que só o Paulo pode ligar antes (16/11/2026)
- 🔴 **Abrir o cadastro no Supabase.** Hoje só a equipe entra, e criar conta está fechado de propósito. Em Authentication → Sign In / Providers, ligar "Allow new users to sign up" e a confirmação de e-mail.
- 🔴 **Remetente de e-mail próprio.** O envio padrão do Supabase serve para teste e trava com poucos e-mails por hora. Para confirmar conta e recuperar senha de clientes de verdade, cadastrar um serviço de envio (SMTP) com o domínio da Emkasa.
- 🟠 **Domínio próprio do site**, se houver, para os links dos e-mails não saírem com `vercel.app`.
- ✅ **Endereço (definido pelo Paulo em 16/11):** entra no cadastro e é confirmado na hora da compra. A conta guarda vários endereços, cada um com um nome (casa, trabalho, casa do pai, da mãe, do filho), sempre pensando na família. A pessoa pode partir da localização do aparelho e ajustar os dados à mão.
- 🟠 **Serviço de mapa para "usar minha localização".** Preencher pelo CEP é gratuito e entra de início. Transformar o GPS do aparelho em rua e número precisa de um serviço de mapas, em geral pago por uso (ex.: Google Maps): escolher qual e criar a chave.

## Chef Emkasa (D-049): o que falta o Paulo definir
A página `/chef-emkasa` já recebe pedidos de proposta. Para virar venda com agenda e preço, faltam:
- quem cozinha no começo (a Chef Angela, outra pessoa ou os dois);
- bairros de Aracaju atendidos e taxa de deslocamento;
- dias, períodos e quantos atendimentos por dia;
- Ocasião: mínimo e máximo de pessoas, quantos tempos, louça e bebida;
- Semana: refeições por visita, duração da visita, quem faz o mercado;
- preço de cada formato e da assinatura; sinal e regra de cancelamento;
- cardápios-base com a ficha de alergênicos de cada prato;
- enquadramento fiscal com o contador;
- texto da Chef aprovado por ela (o mesmo texto provisório da home) e, se houver, uma foto atual dela cozinhando em casa de cliente.

## Entrar com Google ou Facebook (pedido do Paulo, 18/11/2026)
O Paulo quer que as pessoas possam se cadastrar e entrar com a conta do Google ou do Facebook, em breve. O site já usa o login do Supabase, que oferece os dois. Depende do Paulo:
- Google: criar um cliente OAuth no Google Cloud (tela de consentimento com o nome e o logo da Emkasa) e colar o ID e a chave no Supabase (Authentication → Providers → Google);
- Facebook: criar um app no Meta for Developers (pede política de privacidade publicada e, para uso público, verificação da empresa) e colar o ID e a chave no Supabase;
- nos dois, cadastrar o endereço de retorno que o Supabase mostra.
Com isso pronto, entram os botões "Continuar com Google" e "Continuar com Facebook" em Entrar e no cadastro. Antes do Facebook, publicar a página de política de privacidade (já está na fila).

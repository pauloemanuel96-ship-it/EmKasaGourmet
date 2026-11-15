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

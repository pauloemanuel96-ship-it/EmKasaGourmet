# BUSINESS_OVERVIEW — Emkasa Gourmet

> Status: v0.1 (15/11/2026). Itens marcados com **[PENDENTE]** dependem de informação da empresa. Ver PENDENCIAS.md.

## 1. Visão
Ser o HUB de alimentação e cuidado para o lar: comida de verdade, produção própria, conhecimento da Chef Angela
e uma experiência de compra que vira relacionamento recorrente com a família.

**Slogan conceitual:** "Alimentar é uma forma de cuidar."

## 2. Quem está por trás
- **Chef Angela Acioli**: fundadora, vegana, mãe, professora de culinária saudável há mais de 20 anos. É o rosto e a voz da marca.
- Empresa ativa desde 2016, em Aracaju/SE. **[PENDENTE: confirmar cidade(s) de operação e áreas de entrega atuais]**
- Instagram: https://www.instagram.com/emkasagourmet/

## 3. Unidades de negócio

| Unidade | O que vende | Entra em |
|---|---|---|
| **Emkasa Horta** | Frutas, verduras, legumes, ervas e temperos de produção própria e de fornecedores | MVP (Fase 1) |
| **Emkasa Cozinha** | Refeições prontas, congelados, sopas, caldos e encomendas | MVP (Fase 1) |
| **Emkasa Produtos** | Linha própria: Farofa Nutritiva, Blends Veganos, temperos | MVP (Fase 1) |
| **Emkasa BOX** | Cestas por perfil de casa (Solo, Casal, Família, Família Plus, Personalizado) | Fase 4 |
| **Assinaturas** | BOX recorrente semanal/quinzenal | Fase 5 |
| **Emkasa Escola** | Receitas, cursos, aulas, oficinas | Receitas na Fase 2; cursos na Fase 6 |
| **Emkasa Clube** | Pontos, indicação, benefícios | Fase 6 |
| **Parceiros Emkasa** | Produtos de terceiros com curadoria e comissão | Fase 6 |

## 4. Proposta de valor
- **Para a família:** comer bem sem esforço de planejamento. Comida pronta, ingredientes frescos e receitas que conversam entre si.
- **Para quem tem restrições:** transparência real de ingredientes e alergênicos, sustentada por fichas técnicas e não por marketing.
- **Diferencial que ninguém copia:** a Chef Angela. É conhecimento e afeto, não só produto.
- **Ciclo da plataforma:** conteúdo (receita) → produto (ingrediente/prato) → compra → nova receita → recompra.

## 5. Público (hipóteses a validar)
1. **Famílias com rotina corrida** que querem comer melhor em casa (núcleo do BOX e dos congelados).
2. **Veganos e vegetarianos** que buscam variedade e confiança.
3. **Pessoas com restrições alimentares** (exige rigor de alergênicos).
4. **Alunos e seguidores da Chef Angela** (Escola e conteúdo).
5. **Empresas**: BOX de frutas para escritórios, coffee breaks saudáveis, kits para equipes. **Oportunidade de ticket alto e recorrência.**

**[PENDENTE: perfil dos clientes atuais, ticket médio e canais em que vendem hoje]**

## 6. Aquisição (resumo da estratégia de marketing)
- Instagram como vitrine principal; WhatsApp para relacionamento e conversão.
- SEO local: "marmita saudável [cidade]", "comida vegana [cidade]", "cesta de verduras [cidade]".
- Máquina de conteúdo: 1 vídeo da Chef → Reel, cortes curtos, post, artigo no site, receita na biblioteca, produto relacionado e mensagem semanal.
- Indicação entre clientes, parcerias com nutricionistas e academias, B2B.
- Cinco pilares de conteúdo: Chef Angela · Nossa Horta · Alimentação na prática · Produtos Emkasa · Histórias de clientes (sem promessas médicas).

**Implicação técnica:** receitas e produtos precisam estar ligados no banco desde o início (`recipe_products`). É isso que transforma conteúdo em venda.

## 7. Oportunidades e riscos de negócio
| Oportunidade | Observação |
|---|---|
| B2B corporativo | Pode financiar a operação antes do B2C escalar. Validar demanda local. |
| Recorrência (BOX/assinatura) | Maior LTV, mas exige previsibilidade de colheita e produção. Só depois do MVP estável. |
| Escola | Margem alta e sem estoque. Depende de produção de vídeo. |

| Risco | Mitigação |
|---|---|
| Operação depende de uma pessoa (Chef) | Painel extremamente simples e assistente operacional |
| Uso indevido do termo "orgânico" | Regra de bloqueio (ver SECURITY_AND_PRIVACY §6) |
| Alergia: dano real à saúde | Lógica determinística, ficha técnica validada e aviso de contaminação cruzada |
| Escopo grande demais | Roadmap em fases, com cada fase colocada em uso antes da próxima |
| Licenças sanitárias e rotulagem | Validar antes de vender pela internet **[PENDENTE]** |

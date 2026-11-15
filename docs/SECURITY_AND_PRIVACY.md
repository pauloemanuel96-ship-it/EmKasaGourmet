# SECURITY_AND_PRIVACY — Emkasa Gourmet

> v0.1. Documento técnico, **não é parecer jurídico**. Textos de política de privacidade, termos e a classificação
> regulatória dos produtos devem ser validados por profissional habilitado antes do lançamento.

## 1. Autenticação e papéis
- Supabase Auth. Painel com magic link por e-mail (sem senha para a Chef esquecer). MFA (TOTP) obrigatório para `owner`/`admin` antes do lançamento.
- Clientes: checkout sem conta no MVP; conta opcional na Fase 2.
- Papéis em `staff_roles`; autorização sempre no servidor (middleware + `has_role()` nas policies). Esconder botão na UI não é segurança.

| Papel | Pode |
|---|---|
| `owner` | tudo, incluindo papéis, preços, alergênicos, auditoria |
| `admin` | catálogo, preços, pedidos, entregas, auditoria |
| `operacao` | estoque, disponibilidade, status de pedido, rascunho de produto |
| `atendimento` | ver pedidos e clientes, mudar status de entrega |

## 2. Row Level Security
- RLS **ligado em todas as tabelas**, com teste automatizado que falha se alguma tabela de `public` estiver sem RLS.
- Leitura pública (`anon`) apenas de: `products` com `status='active'`, mídia, categorias, alergênicos, rótulos aprovados, zonas ativas e receitas publicadas.
- Produtores: o visitante lê só a view `v_public_producers` (nome, tipo, cidade e selo válido). Estoque: o visitante lê só `is_available`; a quantidade aparece apenas para a equipe (migration 0005).
- `orders`/`customers`: sem acesso `anon` direto. Criação via `create_order` (security definer, com validação interna). Consulta pública só via `tracking_token` + telefone, por função.
- `inventory_movements` e `audit_log`: append-only.
- `service_role` só em Route Handlers/Server Actions e no webhook. Nunca em código de cliente.
- Funções `security definer` com `set search_path = ''` e validação de papel no início.

## 3. LGPD
| Dado | Base legal provável | Medida |
|---|---|---|
| Nome, telefone, endereço (pedido) | execução de contrato | coleta mínima; retenção definida **[PENDENTE prazo]** |
| E-mail/WhatsApp para marketing | consentimento | opt-in separado e desmarcado; descadastro fácil |
| **Alergias e restrições (Fase 4)** | **dado pessoal sensível (saúde): consentimento específico e destacado** | schema `private`, RLS dono-only, sem envio à IA, registro em `consents`, exclusão a pedido |
| Logs técnicos | legítimo interesse | sem dados pessoais em logs de aplicação |

- Página de privacidade + canal do titular (e-mail) para acesso, correção e exclusão.
- Exclusão de cliente: anonimizar `customers` e manter `orders` com dados fiscais mínimos.
- Operadores (Supabase, hospedagem, Mercado Pago, Anthropic): listar na política. Verificar a região do projeto Supabase (preferir São Paulo, `sa-east-1`).
- **Perfis de saúde e contatos de clientes nunca vão para a Claude API.** Única exceção, pela D-021: o arquivo do plano alimentar enviado pelo próprio titular, com consentimento específico e as condições daquela decisão. O assistente operacional trabalha com catálogo e estoque; o de atendimento recebe apenas o necessário e é revisado separadamente.

## 4. Alergênicos e segurança alimentar
1. Alergênicos derivam de ingredientes cadastrados (trigger) + declaração manual de contaminação cruzada.
2. Produto sem `allergens_validated_at` → "Informações em revisão" e excluído de filtros "sem X".
3. "Pode conter" bloqueia igual a "contém" em filtros e no matching.
4. Mudança em ingrediente ou alergênico **zera** `allergens_validated_at` (trigger), o que obriga a revalidação.
5. A loja exibe aviso fixo: as informações seguem a ficha técnica e, em caso de alergia grave, o cliente deve falar com a equipe antes de comprar.
6. Nenhuma IA decide compatibilidade. A IA pode **explicar** um resultado já calculado pelo banco.
7. Lista de alergênicos de referência: lista oficial da ANVISA para rotulagem **[PENDENTE confirmar norma vigente com responsável técnico]**.

## 5. Pagamentos
- Mercado Pago Checkout Pro: o cartão é digitado no ambiente do MP. A plataforma nunca recebe nem armazena dado de cartão.
- Webhook: validar a assinatura (`x-signature`) **e** reconsultar o pagamento na API antes de confirmar. Idempotência por `provider_payment_id`.
- Valor cobrado é sempre o `total_cents` calculado no banco.
- Estorno apenas por `owner`/`admin`, auditado.

## 6. Uso do termo "orgânico"
A produção orgânica tem regras próprias do MAPA. Venda direta por agricultor familiar vinculado a OCS (sem certificação) tem restrições específicas e não equivale a autorização geral para revenda em loja ou plataforma.
**Regra no sistema:**
- O selo/termo "orgânico" só aparece se o `producer.certification` estiver em (`certificado_auditoria`, `certificado_participativo`) **e** válido na data. Casos `ocs` exigem validação caso a caso **[PENDENTE]**.
- Nomes de produto e de BOX não podem conter "orgânico" sem passar por essa regra (validação no formulário do admin).
- Enquanto não houver validação: usar "da nossa horta", "cultivo próprio", "sem agrotóxicos" **só se comprovável** **[PENDENTE]**.
- O "BOX orgânicos" do briefing passa a se chamar provisoriamente **"BOX da Horta"**.

## 7. Aplicação
- Validação Zod no servidor em toda entrada; limites de tamanho e tipo no upload de imagens (apenas imagens, ≤ 5 MB, reprocessadas).
- Cabeçalhos: CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS.
- Rate limit em: checkout, acompanhar pedido, login, assistente.
- Dependências: Dependabot + `npm audit` no CI.
- Segredos em variáveis de ambiente do provedor; `.env*` no `.gitignore`; rotação se houver vazamento.
- Skills e scripts de terceiros no Claude Code: instalar só de fontes conhecidas e ler antes (ver DECISIONS D-010).

## 8. Auditoria
- `audit_log` por trigger em: products, prices, product_allergens, product_ingredients, product_diet_labels, stock (via ledger), orders (status), delivery_*, staff_roles, settings.
- Campo `source` distingue painel, assistente, sistema e checkout.
- Retenção: indefinida no MVP (volume pequeno); revisar na Fase 5.

## 9. Backup e incidentes
- Backup diário externo (SYSTEM_ARCHITECTURE §7), com restauração testada antes do lançamento.
- Em vazamento de dados: avaliar comunicação à ANPD e aos titulares conforme a LGPD, com apoio jurídico.

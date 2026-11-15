# DATABASE_SCHEMA — Emkasa Gourmet

> v0.1. Postgres (Supabase). Convenções: `snake_case`; PK `uuid` (`gen_random_uuid()`); `created_at`/`updated_at timestamptz`;
> dinheiro em centavos `integer`; quantidade `numeric(12,3)`; enums como tipos Postgres.
> ✅ = Fase 1–2 (criar agora) · 🔜 = modelado, criar na fase indicada.

## 1. Mapa de entidades

```
categories ─┐
producers ──┼─< products >── product_media
locations   │      │  ├──< product_ingredients >── ingredients ──< ingredient_allergens >── allergens
   │        │      │  ├──< product_allergens (contains | may_contain) >── allergens
   │        │      │  ├──< product_diet_labels >── diet_labels
   └──< stock_levels ┘  └──< inventory_movements
                            │
customers ──< orders ──< order_items          delivery_zones ──< delivery_days
     │          └──< payments                 delivery_blackouts
     └──< addresses
staff_roles · audit_log · settings · assistant_actions(🔜F3)
recipes ──< recipe_products (🔜F2)
households ──< household_members ──< member_restrictions (🔜F4, dado sensível)
box_plans ──< box_templates ──< box_items · subscriptions ──< subscription_cycles (🔜F4–5)
courses ──< lessons · enrollments · partners · loyalty_ledger (🔜F6)
```

## 2. Catálogo ✅

### `categories`
`id, name, slug unique, business_unit (horta|cozinha|produtos|parceiros), parent_id null, sort_order, is_active`

### `producers`
`id, name, kind (proprio|fornecedor|parceiro), city, certification (none|ocs|certificado_auditoria|certificado_participativo), certification_ref, certification_valid_until, notes`
> Visitante não lê esta tabela: lê a view `v_public_producers` (`id, name, kind, city, organic_certified`), só de produtores com produto ativo.
> A certificação é do **produtor**, não do produto. O selo "orgânico" só é exibido via regra (ver SECURITY_AND_PRIVACY §6).

### `products`
| Campo | Tipo | Notas |
|---|---|---|
| id, slug | uuid, text unique | |
| name, short_description, description | text | |
| business_unit | enum | horta, cozinha, produtos, parceiros |
| category_id | fk | |
| producer_id | fk null | |
| kind | enum | `simple`, `kit` (🔜 composto por outros), `box` (🔜) |
| sale_unit | enum | un, kg, g, maco, pote, porcao, pacote |
| unit_size | numeric null | ex.: 0.500 (kg) para "pote 500 g" |
| price_cents | integer ≥ 0 | |
| status | enum | `draft`, `active`, `archived` (catálogo) |
| stock_mode | enum | `tracked`, `made_to_order`, `untracked` |
| storage | enum | ambiente, refrigerado, congelado |
| shelf_life_days | int null | |
| conservation_info | text | |
| yield_info, weight_grams, portions | | ficha técnica (cozinha) |
| seasonal_months | smallint[] | 1–12 |
| origin | text | |
| allergens_validated_at / _by | timestamptz / fk | **sem isso, RN-08** |
| min_lead_days, daily_limit | int null | para encomendas |
| search_vector | tsvector gerado | nome + descrição + ingredientes, `unaccent` |

Disponibilidade **não é campo** (a quantidade em `available_quantity` só aparece para a equipe): é a view `v_product_availability` = `status = 'active'` e (saldo disponível > 0 ou `stock_mode <> 'tracked'`).

### `product_media`
`id, product_id, storage_path, alt_text not null, sort_order, is_cover`

### Ingredientes e alergênicos
- `allergens`: `id, code unique, name`. Seed com a lista oficial da ANVISA (**[PENDENTE validar lista vigente]**).
- `ingredients`: `id, name unique, is_derived_from null (fk ingredients)`
- `ingredient_allergens`: `(ingredient_id, allergen_id)`
- `product_ingredients`: `(product_id, ingredient_id, position)`
- `product_allergens`: `(product_id, allergen_id, presence enum('contains','may_contain'), source enum('ingredient','cross_contamination','manual'))`
  - Linhas `source = ingredient` são **geradas por trigger** a partir dos ingredientes, sem chance de esquecimento.
  - `may_contain` é declarado manualmente (processo produtivo) e exige `allergens_validated_at` atualizado.
- `diet_labels`: `id, code (vegano, vegetariano, sem_gluten, sem_lactose, low_carb, fit…), name, requires_evidence bool`
- `product_diet_labels`: `(product_id, label_id, evidence text, approved_by, approved_at)`. Aparece na loja só se `approved_at` existe.

## 3. Estoque ✅

### `locations`
`id, name, kind (horta|cozinha|deposito|parceiro), address, is_active`. Seed: 1 local **[PENDENTE nome]**.

### `inventory_movements` (livro-razão, imutável)
| Campo | Notas |
|---|---|
| id, product_id, location_id | |
| quantity | numeric(12,3), positivo ou negativo |
| reason | `stock_in`, `harvest`, `production`, `sale`, `reserve`, `release`, `loss`, `adjustment`, `return` |
| order_id | fk null |
| lot_id | fk null (🔜) |
| actor_id | fk auth.users null (null = sistema) |
| source | `panel`, `assistant`, `system`, `checkout` |
| note | text |
| created_at | |

`UPDATE`/`DELETE` bloqueados por policy e trigger. Correção = novo movimento `adjustment`.

### `stock_levels` (saldo materializado)
`(product_id, location_id) PK, on_hand numeric, reserved numeric, available = on_hand - reserved (gerado), updated_at`
Atualizado **somente** pelo trigger `after insert on inventory_movements`. Constraint `CHECK (available >= 0)`, que é a última barreira contra venda sem estoque.

### 🔜 `lots` (Fase 2, produtos próprios)
`id, product_id, code, produced_at, expires_at, quantity_produced, notes` para rastreabilidade de Farofa e Blends.

### 🔜 `harvests` / `production_batches` (horta ≠ cozinha)
- `harvests`: `product_id, location_id, harvested_at, gross_weight, loss_weight, notes` → gera movimento `harvest`.
- `production_batches`: `recipe_id, produced_at, portions, expires_at` → consome insumos e gera movimento `production`.

## 4. Clientes e pedidos ✅

### `customers`
`id, user_id null (fk auth.users), name, phone (E.164) , email null, marketing_opt_in bool, marketing_opt_in_at, created_at`
> Checkout sem conta (RF-L07). Telefone identifica o cliente. Sem CPF no MVP (coleta mínima); avaliar se a nota fiscal exigir.

### `addresses`
`id, customer_id, label, street, number, complement, district, city, state, zip, reference, delivery_zone_id`

### `orders`
| Campo | Notas |
|---|---|
| id, number | `number` sequencial legível (EMK-000123) |
| customer_id, address_id null | |
| status | `pending_payment`, `paid`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`, `expired` |
| fulfillment | `delivery`, `pickup` |
| delivery_zone_id, delivery_date | |
| subtotal_cents, delivery_fee_cents, discount_cents, total_cents | `CHECK total = subtotal + fee - discount` |
| channel | `site`, `whatsapp`, `admin`, `assistant` |
| reserved_until | timestamptz |
| customer_notes, internal_notes | |
| tracking_token | text aleatório para "acompanhar pedido" |

### `order_items`
`id, order_id, product_id, product_name_snapshot, unit_price_cents_snapshot, sale_unit_snapshot, quantity, line_total_cents, storage_snapshot`

### `payments`
`id, order_id, provider ('mercadopago'), provider_payment_id unique, status, method, amount_cents, raw jsonb, created_at`
> `unique(provider_payment_id)` garante idempotência do webhook.

## 5. Entregas ✅
- `delivery_zones`: `id, name, districts text[] / zip_ranges, fee_cents, min_order_cents, is_active` **[PENDENTE valores reais]**
- `delivery_days`: `zone_id, weekday, cutoff_hours_before, max_orders null`
- `delivery_blackouts`: `date, zone_id null (null = todas), reason`

## 6. Administração ✅
- `staff_roles`: `user_id PK, role enum('owner','admin','operacao','atendimento')`. Função `has_role(role[])` usada nas policies.
- `audit_log`: `id, table_name, record_id, action (insert|update|delete), before jsonb, after jsonb, actor_id, source, created_at`. Trigger genérico nas tabelas administrativas. Somente leitura para `owner`/`admin`.
- `settings`: `key PK, value jsonb, updated_by` (reserva em minutos, WhatsApp de atendimento, textos de política).
- 🔜 `assistant_actions` (F3): `id, actor_id, input_text, intent, proposed_payload jsonb, status (proposed|confirmed|executed|rejected|failed), result jsonb, model, input_tokens, output_tokens, created_at, decided_at`.

## 7. Conteúdo 🔜 F2
- `recipes`: `id, slug, title, summary, body (markdown), video_url, cover_path, prep_minutes, servings, is_published, author ('Chef Angela')`
- `recipe_products`: `(recipe_id, product_id, note)`, para ligar conteúdo e venda.

## 8. Minha Casa Emkasa 🔜 F4 (dado sensível: ver SECURITY_AND_PRIVACY §3)
- `households`: `id, customer_id, residents_count, consumers_count, budget_range, accepts_substitutions`
- `household_members`: `id, household_id, nickname` (apelido, sem nome completo nem data de nascimento)
- `member_preferences`: `member_id, kind (likes|dislikes|diet), ingredient_id | label_id`
- `member_restrictions`: `member_id, allergen_id, severity_declared, consent_id`. **Schema separado `private`** com RLS restrito ao dono e a uma função de matching.
- `consents`: `id, customer_id, purpose, text_version, granted_at, revoked_at`

**Compatibilidade (determinística):** função `product_compatible_with_household(product_id, household_id)` retorna `blocked` se qualquer alergênico declarado dos membros ∈ `product_allergens` (contains **ou** may_contain), ou se `allergens_validated_at` é null. Não há IA nesse caminho.

## 9. BOX e assinaturas 🔜 F4–F5
- `box_plans`: `id, code (solo|casal|familia|familia_plus|personalizado), name, base_price_cents, target_consumers`
- `box_templates`: composição-base por semana: `plan_id, week_start, items` (`box_template_items: product_id, quantity, is_swappable, swap_group`)
- `box_compositions`: composição final por cliente/ciclo após cruzar perfil × estoque.
- `subscriptions`: `id, customer_id, plan_id, frequency (weekly|biweekly), status (active|paused|cancelled), next_cycle_date, delivery_zone_id, paused_until, provider_subscription_id`
- `subscription_cycles`: `id, subscription_id, cycle_date, composition_id, order_id, status (scheduled|editable|locked|ordered|skipped)`
> Cada ciclo **gera um pedido normal**. Assim o estoque, o pagamento e a entrega reutilizam o fluxo do MVP sem reconstrução.

## 10. Escola, Clube, Parceiros 🔜 F6
- `courses, lessons, enrollments (customer_id, course_id, payment_id, progress)`
- `loyalty_ledger (customer_id, points ±, reason, order_id)`: livro-razão, como o estoque
- `partners (id, name, commission_pct, contract_ref)`; `products.partner_id` + flag `is_sponsored` exibida na loja

## 11. Funções SQL críticas (Fase 1–2)
| Função | Garante |
|---|---|
| `register_stock_movement(...)` | valida papel, insere movimento e atualiza saldo (trigger) |
| `create_order(payload jsonb)` | preços do banco, lock de saldo, reserva, totais, tudo na mesma transação |
| `confirm_payment(provider_payment_id, ...)` | idempotente; `reserve` → `sale`; status `paid` |
| `cancel_order(order_id, reason)` | libera ou devolve estoque, status e auditoria |
| `release_expired_reservations()` | pg_cron a cada 5 min |
| `available_delivery_dates(zone_id, from)` | dias × prazo de corte × bloqueios × capacidade |

Cada função tem teste em `tests/db` (D-017) cobrindo: saldo insuficiente, concorrência (dois pedidos no último item), webhook duplicado e expiração.

## 12. Acréscimos da migration 0006
- `categories`: `kind ('loja'|'encomendas')`, `description`, `is_featured`. Triggers de herança (canal e área) e bloqueio de ciclo.
- `products`: `quote_only`. `sale_unit` ganhou `duzia, cacho, bandeja, litro, kit, combo`.
- `allergens.filter_group` · `diet_label_blockers (label_id, allergen_id, include_may_contain)`.
- `campaigns (slug, name, description, starts_on, ends_on, order_deadline, is_active, sort_order)` · `product_campaigns`.
- Views públicas (somente leitura): `v_store_categories` (árvore visível, com `root_slug`, `path_names`, `depth`) e `v_store_catalog` (produto ativo em categoria visível, com `channel`, `is_available`, `in_season`, `ingredients`, `contains`, `may_contain`, `blocked_groups`, `diet_labels`, `campaigns`, `cover`).
- Funções do painel: ver D-029.

-- =============================================================================
-- Emkasa Gourmet · 0006 · Estrutura real do catálogo
--
-- O que entra aqui:
--   A) unidades de venda extras
--   B) utilitários de slug
--   C) categorias em árvore: canal (loja | encomendas), destaque, descrição,
--      herança de canal/área e a árvore inicial informada pela Emkasa (15/11/2026)
--   D) produtos "sob orçamento" (sem preço fixo)
--   E) alergênicos: grupo de filtro ("sem glúten" cobre trigo, centeio, cevada, aveia)
--      e rótulos alimentares que não podem conviver com certos alergênicos
--   F) campanhas sazonais
--   G) views públicas da loja (só o que pode aparecer para o visitante)
--   H) funções do painel: gravam produto, categoria, ingrediente e campanha em uma
--      transação só (CLAUDE.md, regra 7)
--
-- Nenhum produto, preço, peso ou ingrediente é criado aqui: isso é cadastro do painel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Unidades de venda extras (o valor novo só pode ser usado após o commit)
-- -----------------------------------------------------------------------------
alter type public.sale_unit add value if not exists 'duzia';
alter type public.sale_unit add value if not exists 'cacho';
alter type public.sale_unit add value if not exists 'bandeja';
alter type public.sale_unit add value if not exists 'litro';
alter type public.sale_unit add value if not exists 'kit';
alter type public.sale_unit add value if not exists 'combo';

-- -----------------------------------------------------------------------------
-- B) Slugs
-- -----------------------------------------------------------------------------
create or replace function public.slugify(p_text text)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(
    trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g')),
    ''
  );
$$;

-- Devolve p_base, ou p_base-2, p_base-3… até não colidir na tabela informada.
create or replace function public.unique_slug(p_base text, p_table regclass, p_exclude uuid default null)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_slug   text := p_base;
  v_n      integer := 1;
  v_exists boolean;
begin
  if v_slug is null then
    raise exception 'Informe um nome com letras ou números.' using errcode = 'invalid_parameter_value';
  end if;
  loop
    execute format('select exists (select 1 from %s where slug = $1 and ($2::uuid is null or id <> $2))', p_table)
      into v_exists using v_slug, p_exclude;
    exit when not v_exists;
    v_n := v_n + 1;
    v_slug := p_base || '-' || v_n;
  end loop;
  return v_slug;
end;
$$;

-- -----------------------------------------------------------------------------
-- C) Categorias em árvore
-- -----------------------------------------------------------------------------
alter table public.categories
  add column kind text not null default 'loja'
    constraint categories_kind_check check (kind in ('loja', 'encomendas')),
  add column description text,
  add column is_featured boolean not null default false;

comment on column public.categories.kind is
  'Canal: loja (carrinho) ou encomendas (página de Encomendas e Confraternizações, com pedido de orçamento). Vale para a árvore inteira.';

-- Subcategoria herda canal e área da categoria-mãe; impede ciclos.
create or replace function public.categories_inherit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cursor uuid := new.parent_id;
  v_next   uuid;
  v_depth  integer := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  while v_cursor is not null loop
    if v_cursor = new.id then
      raise exception 'Uma categoria não pode ficar dentro dela mesma.' using errcode = 'check_violation';
    end if;
    v_depth := v_depth + 1;
    if v_depth > 5 then
      raise exception 'A árvore de categorias aceita até 5 níveis.' using errcode = 'check_violation';
    end if;
    select c.parent_id into v_next from public.categories c where c.id = v_cursor;
    if not found then
      raise exception 'Categoria-mãe não encontrada.' using errcode = 'foreign_key_violation';
    end if;
    v_cursor := v_next;
  end loop;

  select c.kind, c.business_unit into new.kind, new.business_unit
  from public.categories c
  where c.id = new.parent_id;

  return new;
end;
$$;

create trigger categories_inherit
  before insert or update of parent_id, kind, business_unit on public.categories
  for each row execute function public.categories_inherit();

-- Mudou o canal ou a área de uma categoria: as filhas e os produtos acompanham.
create or replace function public.categories_propagate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind is distinct from old.kind or new.business_unit is distinct from old.business_unit then
    update public.categories
       set kind = new.kind, business_unit = new.business_unit
     where parent_id = new.id;
  end if;
  if new.business_unit is distinct from old.business_unit then
    update public.products
       set business_unit = new.business_unit
     where category_id = new.id and business_unit is distinct from new.business_unit;
  end if;
  return null;
end;
$$;

create trigger categories_propagate
  after update of kind, business_unit on public.categories
  for each row execute function public.categories_propagate();

-- Árvore inicial, com os nomes informados pela Emkasa em 15/11/2026.
-- Pode ser renomeada, reordenada ou desativada pelo painel.
insert into public.categories (name, slug, business_unit, kind, sort_order)
values
  ('Produtos da Emkasa',             'produtos-da-emkasa',             'produtos', 'loja',       10),
  ('Horta e Naturais',               'horta-e-naturais',               'horta',    'loja',       20),
  ('Refeições Congeladas',           'refeicoes-congeladas',           'cozinha',  'loja',       30),
  ('Encomendas e Confraternizações', 'encomendas-e-confraternizacoes', 'cozinha',  'encomendas', 40)
on conflict (slug) do nothing;

insert into public.categories (name, slug, business_unit, parent_id, sort_order, is_featured, description)
select v.name, v.slug, p.business_unit, p.id, v.sort_order, v.is_featured, v.description
from (values
  ('Blends Veganos',                 'blends-veganos',                 'produtos-da-emkasa',             10, false, null),
  ('Almôndegas',                     'almondegas',                     'produtos-da-emkasa',             20, false, null),
  ('Frutas',                         'frutas',                         'horta-e-naturais',               10, false, null),
  ('Legumes e raízes',               'legumes-e-raizes',               'horta-e-naturais',               20, false, null),
  ('Verduras e folhas',              'verduras-e-folhas',              'horta-e-naturais',               30, false, null),
  ('Kits de refeições congeladas',   'kits-de-refeicoes-congeladas',   'refeicoes-congeladas',           10, false, null),
  ('Refeições individuais',          'refeicoes-individuais',          'refeicoes-congeladas',           20, false, null),
  ('Combos semanais',                'combos-semanais',                'refeicoes-congeladas',           30, false, null),
  ('Ceia Natural Emkasa',            'ceia-natural-emkasa',            'encomendas-e-confraternizacoes', 10, true,
     'Preparações naturais, veganas, vegetarianas e acompanhamentos especiais, conforme o cardápio cadastrado.'),
  ('Ceia Tradicional',               'ceia-tradicional',               'encomendas-e-confraternizacoes', 20, true,
     'Pratos tradicionais de Natal, carnes e aves, acompanhamentos, saladas e sobremesas, conforme o cardápio cadastrado.'),
  ('Confraternizações empresariais', 'confraternizacoes-empresariais', 'encomendas-e-confraternizacoes', 30, false, null),
  ('Almoços e jantares especiais',   'almocos-e-jantares-especiais',   'encomendas-e-confraternizacoes', 40, false, null),
  ('Combos para famílias',           'combos-para-familias',           'encomendas-e-confraternizacoes', 50, false, null),
  ('Pratos para compartilhar',       'pratos-para-compartilhar',       'encomendas-e-confraternizacoes', 60, false, null),
  ('Eventos e celebrações',          'eventos-e-celebracoes',          'encomendas-e-confraternizacoes', 70, false, null)
) as v (name, slug, parent_slug, sort_order, is_featured, description)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- D) Produtos sob orçamento
-- -----------------------------------------------------------------------------
alter table public.products
  add column quote_only boolean not null default false;

comment on column public.products.quote_only is
  'Sem preço fixo: aparece como "sob orçamento". Usado em Encomendas e Confraternizações.';

alter table public.products drop constraint products_active_requires_price;
alter table public.products add constraint products_active_requires_price
  check (
    status <> 'active'
    or (category_id is not null and (price_cents is not null or quote_only))
  );

-- -----------------------------------------------------------------------------
-- E) Alergênicos: grupo de filtro e rótulos incompatíveis
-- -----------------------------------------------------------------------------
-- Grupo usado nos filtros "sem X" da loja. Conservador de propósito: "sem glúten"
-- exclui também trigo, centeio, cevada e aveia; "sem leite" exclui também lactose;
-- "sem castanhas" exclui cada castanha listada.
-- [PENDENTE] Validar com o responsável técnico junto com a lista de alergênicos.
alter table public.allergens add column filter_group text;

update public.allergens
   set filter_group = case
     when code in ('gluten', 'trigo', 'centeio', 'cevada', 'aveia') then 'gluten'
     when code in ('leite', 'lactose') then 'leite'
     when code in ('amendoa', 'avela', 'castanha_de_caju', 'castanha_do_para', 'macadamia',
                   'nozes', 'peca', 'pistache', 'pinoli', 'castanhas') then 'castanhas'
     else code
   end;

alter table public.allergens alter column filter_group set not null;

create or replace function public.allergens_default_group()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.filter_group := coalesce(nullif(trim(new.filter_group), ''), new.code);
  return new;
end;
$$;

create trigger allergens_default_group
  before insert or update of filter_group, code on public.allergens
  for each row execute function public.allergens_default_group();

-- Um rótulo não pode aparecer se a ficha declara um alergênico incompatível.
-- include_may_contain = true: "pode conter" também derruba o rótulo (rótulos "sem X").
-- include_may_contain = false: só "contém" derruba (vegano com "pode conter leite"
-- por contato cruzado continua vegano pela composição).
create table public.diet_label_blockers (
  label_id            uuid not null references public.diet_labels (id) on delete cascade,
  allergen_id         uuid not null references public.allergens (id) on delete cascade,
  include_may_contain boolean not null default true,
  primary key (label_id, allergen_id)
);

insert into public.diet_label_blockers (label_id, allergen_id, include_may_contain)
select dl.id, al.id, v.include_may_contain
from (values
  ('sem_gluten',  'gluten',     true),
  ('sem_gluten',  'trigo',      true),
  ('sem_gluten',  'centeio',    true),
  ('sem_gluten',  'cevada',     true),
  ('sem_gluten',  'aveia',      true),
  ('sem_lactose', 'lactose',    true),
  ('vegano',      'leite',      false),
  ('vegano',      'lactose',    false),
  ('vegano',      'ovos',       false),
  ('vegano',      'peixes',     false),
  ('vegano',      'crustaceos', false),
  ('vegetariano', 'peixes',     false),
  ('vegetariano', 'crustaceos', false)
) as v (label_code, allergen_code, include_may_contain)
join public.diet_labels dl on dl.code = v.label_code
join public.allergens al on al.code = v.allergen_code
on conflict do nothing;

create trigger diet_label_blockers_audit
  after insert or update or delete on public.diet_label_blockers
  for each row execute function public.audit_row('label_id');

-- -----------------------------------------------------------------------------
-- F) Campanhas sazonais
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null check (length(trim(name)) > 0),
  description    text,
  starts_on      date,
  ends_on        date,
  order_deadline date,
  is_active      boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint campaigns_period_check check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

comment on column public.campaigns.order_deadline is 'Último dia para encomendar. Nulo = sem prazo informado.';

create table public.product_campaigns (
  product_id  uuid not null references public.products (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  primary key (product_id, campaign_id)
);

create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();
create trigger campaigns_audit after insert or update or delete on public.campaigns
  for each row execute function public.audit_row();
create trigger product_campaigns_audit after insert or update or delete on public.product_campaigns
  for each row execute function public.audit_row('product_id');

-- Nomes informados pela Emkasa. Ficam desligadas e sem datas até a equipe definir.
insert into public.campaigns (slug, name, sort_order)
values
  ('natal',                'Natal',                10),
  ('ano-novo',             'Ano-Novo',             20),
  ('pascoa',               'Páscoa',               30),
  ('dia-das-maes',         'Dia das Mães',         40),
  ('eventos-corporativos', 'Eventos corporativos', 50)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- RLS das tabelas novas
-- -----------------------------------------------------------------------------
alter table public.diet_label_blockers enable row level security;
alter table public.campaigns           enable row level security;
alter table public.product_campaigns   enable row level security;

create policy "diet_label_blockers: leitura" on public.diet_label_blockers for select to anon, authenticated
  using (true);
create policy "diet_label_blockers: gestores escrevem" on public.diet_label_blockers for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy "campaigns: leitura" on public.campaigns for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "campaigns: gestores escrevem" on public.campaigns for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy "product_campaigns: leitura" on public.product_campaigns for select to anon, authenticated
  using (public.product_is_public(product_id) or public.is_staff());
create policy "product_campaigns: gestores escrevem" on public.product_campaigns for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

grant select on public.diet_label_blockers, public.campaigns, public.product_campaigns to anon, authenticated;
grant insert, update, delete on public.diet_label_blockers, public.campaigns, public.product_campaigns to authenticated;

-- -----------------------------------------------------------------------------
-- G) Views públicas da loja
-- As duas rodam com as permissões do dono de propósito: são elas que decidem o
-- que sai. Só categorias ativas (com todas as ancestrais ativas) e só produtos
-- ativos dentro delas.
-- -----------------------------------------------------------------------------
create view public.v_store_categories as
with recursive tree as (
  select
    c.id, c.slug, c.name, c.description, c.parent_id,
    c.id as root_id, c.slug as root_slug, c.name as root_name,
    c.kind, c.business_unit, c.is_featured, c.sort_order,
    0 as depth,
    array[c.slug] as path_slugs,
    array[c.name] as path_names,
    array[c.sort_order] as sort_path,
    c.is_active as visible
  from public.categories c
  where c.parent_id is null
  union all
  select
    c.id, c.slug, c.name, c.description, c.parent_id,
    t.root_id, t.root_slug, t.root_name,
    c.kind, c.business_unit, c.is_featured, c.sort_order,
    t.depth + 1,
    t.path_slugs || c.slug,
    t.path_names || c.name,
    t.sort_path || c.sort_order,
    t.visible and c.is_active
  from public.categories c
  join tree t on c.parent_id = t.id
)
select
  id, slug, name, description, parent_id, root_id, root_slug, root_name,
  kind, business_unit, is_featured, sort_order, depth, path_slugs, path_names, sort_path
from tree
where visible;

create view public.v_store_catalog as
select
  p.id,
  p.slug,
  p.name,
  p.short_description,
  p.description,
  p.sale_unit,
  p.unit_size,
  p.price_cents,
  p.quote_only,
  p.storage,
  p.conservation_info,
  p.origin,
  p.stock_mode,
  p.portions,
  p.yield_info,
  p.seasonal_months,
  coalesce(
    extract(month from (now() at time zone 'America/Sao_Paulo'))::smallint = any (p.seasonal_months),
    false
  ) as in_season,
  c.id   as category_id,
  c.slug as category_slug,
  c.name as category_name,
  c.root_slug,
  c.root_name,
  c.kind as channel,
  c.path_slugs,
  c.path_names,
  c.sort_path,
  (p.allergens_validated_at is not null) as allergens_validated,
  a.is_available,
  (
    select coalesce(jsonb_agg(i.name order by pi.position, i.name), '[]'::jsonb)
    from public.product_ingredients pi
    join public.ingredients i on i.id = pi.ingredient_id
    where pi.product_id = p.id
  ) as ingredients,
  (
    select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'name', x.name) order by x.name), '[]'::jsonb)
    from (
      select distinct al.code, al.name
      from public.product_allergens pa
      join public.allergens al on al.id = pa.allergen_id
      where pa.product_id = p.id and pa.presence = 'contains'
    ) x
  ) as contains,
  (
    select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'name', x.name) order by x.name), '[]'::jsonb)
    from (
      select distinct al.code, al.name
      from public.product_allergens pa
      join public.allergens al on al.id = pa.allergen_id
      where pa.product_id = p.id
        and pa.presence = 'may_contain'
        and not exists (
          select 1 from public.product_allergens c2
          where c2.product_id = p.id and c2.allergen_id = pa.allergen_id and c2.presence = 'contains'
        )
    ) x
  ) as may_contain,
  (
    select coalesce(array_agg(distinct al.filter_group order by al.filter_group), '{}'::text[])
    from public.product_allergens pa
    join public.allergens al on al.id = pa.allergen_id
    where pa.product_id = p.id
  ) as blocked_groups,
  -- Rótulo só aparece se: aprovado, ficha de alergênicos validada e sem alergênico incompatível.
  (
    select coalesce(jsonb_agg(jsonb_build_object('code', dl.code, 'name', dl.name) order by dl.name), '[]'::jsonb)
    from public.product_diet_labels pdl
    join public.diet_labels dl on dl.id = pdl.label_id
    where pdl.product_id = p.id
      and pdl.approved_at is not null
      and p.allergens_validated_at is not null
      and not exists (
        select 1
        from public.diet_label_blockers b
        join public.product_allergens pa on pa.allergen_id = b.allergen_id and pa.product_id = p.id
        where b.label_id = pdl.label_id
          and (pa.presence = 'contains' or b.include_may_contain)
      )
  ) as diet_labels,
  (
    select coalesce(jsonb_agg(cp.slug order by cp.sort_order, cp.name), '[]'::jsonb)
    from public.product_campaigns pc
    join public.campaigns cp on cp.id = pc.campaign_id
    where pc.product_id = p.id and cp.is_active
  ) as campaigns,
  (
    select jsonb_build_object('path', m.storage_path, 'alt', m.alt_text)
    from public.product_media m
    where m.product_id = p.id and m.is_cover
    limit 1
  ) as cover
from public.products p
join public.v_store_categories c on c.id = p.category_id
join public.v_product_availability a on a.product_id = p.id
where p.status = 'active';

grant select on public.v_store_categories, public.v_store_catalog to anon, authenticated;

-- -----------------------------------------------------------------------------
-- H) Funções do painel
-- Rodam com as permissões de quem chama: o RLS continua valendo. As checagens
-- de papel no início servem para devolver mensagens claras.
-- -----------------------------------------------------------------------------

-- Categoria: cria ou edita. Devolve o id.
create or replace function public.admin_save_category(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id     uuid := nullif(p ->> 'id', '')::uuid;
  v_name   text := nullif(trim(p ->> 'name'), '');
  v_parent uuid := nullif(p ->> 'parent_id', '')::uuid;
  v_kind   text := coalesce(nullif(p ->> 'kind', ''), 'loja');
  v_unit   public.business_unit := coalesce(nullif(p ->> 'business_unit', '')::public.business_unit, 'cozinha');
  v_sort   integer := nullif(p ->> 'sort_order', '')::integer;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar categorias.' using errcode = 'insufficient_privilege';
  end if;
  if v_name is null then
    raise exception 'Informe o nome da categoria.' using errcode = 'invalid_parameter_value';
  end if;
  if v_kind not in ('loja', 'encomendas') then
    raise exception 'Canal inválido.' using errcode = 'invalid_parameter_value';
  end if;

  if v_sort is null then
    select coalesce(max(c.sort_order), 0) + 10 into v_sort
    from public.categories c
    where c.parent_id is not distinct from v_parent and (v_id is null or c.id <> v_id);
  end if;

  if v_id is null then
    insert into public.categories (name, slug, business_unit, kind, parent_id, description, is_featured, sort_order, is_active)
    values (
      v_name,
      public.unique_slug(public.slugify(v_name), 'public.categories'::regclass),
      v_unit,
      v_kind,
      v_parent,
      nullif(trim(p ->> 'description'), ''),
      coalesce((p ->> 'is_featured')::boolean, false),
      v_sort,
      coalesce((p ->> 'is_active')::boolean, true)
    )
    returning id into v_id;
  else
    update public.categories
       set name = v_name,
           parent_id = v_parent,
           kind = v_kind,
           business_unit = v_unit,
           description = nullif(trim(p ->> 'description'), ''),
           is_featured = coalesce((p ->> 'is_featured')::boolean, false),
           sort_order = v_sort,
           is_active = coalesce((p ->> 'is_active')::boolean, true)
     where id = v_id;
    if not found then
      raise exception 'Categoria não encontrada.' using errcode = 'no_data_found';
    end if;
  end if;

  return v_id;
end;
$$;

-- Ingrediente: nome, origem (derivado de) e alergênicos. Devolve o id.
create or replace function public.admin_save_ingredient(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id      uuid := nullif(p ->> 'id', '')::uuid;
  v_name    text := nullif(trim(p ->> 'name'), '');
  v_derived uuid := nullif(p ->> 'is_derived_from', '')::uuid;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar ingredientes.' using errcode = 'insufficient_privilege';
  end if;
  if v_name is null then
    raise exception 'Informe o nome do ingrediente.' using errcode = 'invalid_parameter_value';
  end if;
  if exists (
    select 1 from public.ingredients i
    where lower(i.name) = lower(v_name) and (v_id is null or i.id <> v_id)
  ) then
    raise exception 'Já existe um ingrediente chamado "%".', v_name using errcode = 'unique_violation';
  end if;

  if v_id is null then
    insert into public.ingredients (name, is_derived_from)
    values (v_name, v_derived)
    returning id into v_id;
  else
    update public.ingredients
       set name = v_name, is_derived_from = v_derived
     where id = v_id;
    if not found then
      raise exception 'Ingrediente não encontrado.' using errcode = 'no_data_found';
    end if;
  end if;

  if p ? 'allergen_ids' then
    delete from public.ingredient_allergens ia
     where ia.ingredient_id = v_id
       and not exists (
         select 1 from jsonb_array_elements_text(p -> 'allergen_ids') as t (id)
         where t.id::uuid = ia.allergen_id
       );
    insert into public.ingredient_allergens (ingredient_id, allergen_id)
    select distinct v_id, t.id::uuid
    from jsonb_array_elements_text(p -> 'allergen_ids') as t (id)
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

-- Campanha: cria ou edita. Devolve o id.
create or replace function public.admin_save_campaign(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id   uuid := nullif(p ->> 'id', '')::uuid;
  v_name text := nullif(trim(p ->> 'name'), '');
  v_sort integer := nullif(p ->> 'sort_order', '')::integer;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar campanhas.' using errcode = 'insufficient_privilege';
  end if;
  if v_name is null then
    raise exception 'Informe o nome da campanha.' using errcode = 'invalid_parameter_value';
  end if;

  if v_sort is null then
    select coalesce(max(c.sort_order), 0) + 10 into v_sort
    from public.campaigns c
    where v_id is null or c.id <> v_id;
  end if;

  if v_id is null then
    insert into public.campaigns (slug, name, description, starts_on, ends_on, order_deadline, is_active, sort_order)
    values (
      public.unique_slug(public.slugify(v_name), 'public.campaigns'::regclass),
      v_name,
      nullif(trim(p ->> 'description'), ''),
      nullif(p ->> 'starts_on', '')::date,
      nullif(p ->> 'ends_on', '')::date,
      nullif(p ->> 'order_deadline', '')::date,
      coalesce((p ->> 'is_active')::boolean, false),
      v_sort
    )
    returning id into v_id;
  else
    update public.campaigns
       set name = v_name,
           description = nullif(trim(p ->> 'description'), ''),
           starts_on = nullif(p ->> 'starts_on', '')::date,
           ends_on = nullif(p ->> 'ends_on', '')::date,
           order_deadline = nullif(p ->> 'order_deadline', '')::date,
           is_active = coalesce((p ->> 'is_active')::boolean, false),
           sort_order = v_sort
     where id = v_id;
    if not found then
      raise exception 'Campanha não encontrada.' using errcode = 'no_data_found';
    end if;
  end if;

  return v_id;
end;
$$;

-- Produto: dados, ficha técnica, rótulos e campanhas em uma transação.
-- Gestores (owner/admin) fazem tudo. Operação só cria rascunho, sem ficha técnica.
-- Chaves ausentes em ingredient_ids / may_contain_ids / contains_manual_ids /
-- diet_labels / campaign_ids deixam aquela parte como está.
create or replace function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id         uuid := nullif(p ->> 'id', '')::uuid;
  v_manager    boolean := public.is_manager();
  v_name       text := nullif(trim(p ->> 'name'), '');
  v_status     public.product_status := coalesce(nullif(p ->> 'status', '')::public.product_status, 'draft');
  v_price      integer := nullif(p ->> 'price_cents', '')::integer;
  v_quote_only boolean := coalesce((p ->> 'quote_only')::boolean, false);
  v_category   public.categories;
  v_months     smallint[];
  v_conflict   text;
begin
  if not (v_manager or public.has_role(array['operacao']::public.staff_role[])) then
    raise exception 'Sem permissão para cadastrar produtos.' using errcode = 'insufficient_privilege';
  end if;

  if not v_manager then
    if v_id is not null then
      raise exception 'A operação cria rascunhos; a edição é feita pela administração.' using errcode = 'insufficient_privilege';
    end if;
    if v_status <> 'draft' then
      raise exception 'A operação só cria rascunhos; quem publica é a administração.' using errcode = 'insufficient_privilege';
    end if;
    if p ?| array['ingredient_ids', 'may_contain_ids', 'contains_manual_ids', 'diet_labels', 'campaign_ids'] then
      raise exception 'Ficha técnica, rótulos e campanhas são preenchidos pela administração.' using errcode = 'insufficient_privilege';
    end if;
  end if;

  if v_name is null then
    raise exception 'Informe o nome do produto.' using errcode = 'invalid_parameter_value';
  end if;

  select * into v_category from public.categories where id = nullif(p ->> 'category_id', '')::uuid;
  if not found then
    raise exception 'Escolha uma categoria.' using errcode = 'invalid_parameter_value';
  end if;

  if nullif(p ->> 'sale_unit', '') is null then
    raise exception 'Escolha a unidade de venda.' using errcode = 'invalid_parameter_value';
  end if;
  if v_price is not null and v_price < 0 then
    raise exception 'O preço não pode ser negativo.' using errcode = 'invalid_parameter_value';
  end if;
  if v_status = 'active' and v_price is null and not v_quote_only then
    raise exception 'Para ativar, informe o preço ou marque "sob orçamento".' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p -> 'seasonal_months') = 'array' and jsonb_array_length(p -> 'seasonal_months') > 0 then
    select array_agg(distinct m.value::smallint order by m.value::smallint) into v_months
    from jsonb_array_elements_text(p -> 'seasonal_months') as m (value);
  end if;

  if v_id is null then
    insert into public.products (
      slug, name, short_description, description, business_unit, category_id,
      sale_unit, unit_size, price_cents, quote_only, status, stock_mode, storage,
      shelf_life_days, conservation_info, yield_info, portions, seasonal_months, origin
    )
    values (
      public.unique_slug(public.slugify(v_name), 'public.products'::regclass),
      v_name,
      nullif(trim(p ->> 'short_description'), ''),
      nullif(trim(p ->> 'description'), ''),
      v_category.business_unit,
      v_category.id,
      (p ->> 'sale_unit')::public.sale_unit,
      nullif(p ->> 'unit_size', '')::numeric,
      v_price,
      v_quote_only,
      v_status,
      coalesce(nullif(p ->> 'stock_mode', '')::public.stock_mode, 'tracked'),
      coalesce(nullif(p ->> 'storage', '')::public.storage_kind, 'ambiente'),
      nullif(p ->> 'shelf_life_days', '')::integer,
      nullif(trim(p ->> 'conservation_info'), ''),
      nullif(trim(p ->> 'yield_info'), ''),
      nullif(p ->> 'portions', '')::integer,
      v_months,
      nullif(trim(p ->> 'origin'), '')
    )
    returning id into v_id;
  else
    update public.products
       set name = v_name,
           short_description = nullif(trim(p ->> 'short_description'), ''),
           description = nullif(trim(p ->> 'description'), ''),
           business_unit = v_category.business_unit,
           category_id = v_category.id,
           sale_unit = (p ->> 'sale_unit')::public.sale_unit,
           unit_size = nullif(p ->> 'unit_size', '')::numeric,
           price_cents = v_price,
           quote_only = v_quote_only,
           status = v_status,
           stock_mode = coalesce(nullif(p ->> 'stock_mode', '')::public.stock_mode, 'tracked'),
           storage = coalesce(nullif(p ->> 'storage', '')::public.storage_kind, 'ambiente'),
           shelf_life_days = nullif(p ->> 'shelf_life_days', '')::integer,
           conservation_info = nullif(trim(p ->> 'conservation_info'), ''),
           yield_info = nullif(trim(p ->> 'yield_info'), ''),
           portions = nullif(p ->> 'portions', '')::integer,
           seasonal_months = v_months,
           origin = nullif(trim(p ->> 'origin'), '')
     where id = v_id;
    if not found then
      raise exception 'Produto não encontrado.' using errcode = 'no_data_found';
    end if;
  end if;

  -- Ingredientes: só mexe no que mudou, para não derrubar a validação à toa.
  if p ? 'ingredient_ids' then
    delete from public.product_ingredients pi
     where pi.product_id = v_id
       and not exists (
         select 1 from jsonb_array_elements_text(p -> 'ingredient_ids') as t (id)
         where t.id::uuid = pi.ingredient_id
       );
    insert into public.product_ingredients (product_id, ingredient_id, position)
    select v_id, t.id::uuid, min(t.ord)::integer
    from jsonb_array_elements_text(p -> 'ingredient_ids') with ordinality as t (id, ord)
    group by t.id
    on conflict (product_id, ingredient_id) do update
      set position = excluded.position
      where public.product_ingredients.position is distinct from excluded.position;
  end if;

  -- "Pode conter": declaração do processo produtivo (contato cruzado).
  if p ? 'may_contain_ids' then
    delete from public.product_allergens pa
     where pa.product_id = v_id
       and pa.source = 'cross_contamination'
       and not exists (
         select 1 from jsonb_array_elements_text(p -> 'may_contain_ids') as t (id)
         where t.id::uuid = pa.allergen_id
       );
    insert into public.product_allergens (product_id, allergen_id, presence, source)
    select distinct v_id, t.id::uuid, 'may_contain'::public.allergen_presence, 'cross_contamination'::public.allergen_source
    from jsonb_array_elements_text(p -> 'may_contain_ids') as t (id)
    on conflict do nothing;
  end if;

  -- "Contém" declarado à mão (quando o alergênico não vem de um ingrediente cadastrado).
  if p ? 'contains_manual_ids' then
    delete from public.product_allergens pa
     where pa.product_id = v_id
       and pa.source = 'manual'
       and not exists (
         select 1 from jsonb_array_elements_text(p -> 'contains_manual_ids') as t (id)
         where t.id::uuid = pa.allergen_id
       );
    insert into public.product_allergens (product_id, allergen_id, presence, source)
    select distinct v_id, t.id::uuid, 'contains'::public.allergen_presence, 'manual'::public.allergen_source
    from jsonb_array_elements_text(p -> 'contains_manual_ids') as t (id)
    on conflict do nothing;
  end if;

  -- Rótulos alimentares: exigem evidência e não podem contrariar a ficha.
  if p ? 'diet_labels' then
    select string_agg(distinct format('%s × %s', dl.name, al.name), '; ') into v_conflict
    from jsonb_to_recordset(p -> 'diet_labels') as t (label_id uuid, evidence text)
    join public.diet_labels dl on dl.id = t.label_id
    join public.diet_label_blockers b on b.label_id = dl.id
    join public.product_allergens pa
      on pa.product_id = v_id
     and pa.allergen_id = b.allergen_id
     and (pa.presence = 'contains' or b.include_may_contain)
    join public.allergens al on al.id = pa.allergen_id;

    if v_conflict is not null then
      raise exception 'Rótulo em conflito com a ficha de alergênicos (%).', v_conflict using errcode = 'check_violation';
    end if;

    if exists (
      select 1
      from jsonb_to_recordset(p -> 'diet_labels') as t (label_id uuid, evidence text)
      join public.diet_labels dl on dl.id = t.label_id
      where dl.requires_evidence and nullif(trim(t.evidence), '') is null
    ) then
      raise exception 'Informe a evidência de cada rótulo marcado (ficha técnica, laudo ou composição).' using errcode = 'invalid_parameter_value';
    end if;

    delete from public.product_diet_labels pdl
     where pdl.product_id = v_id
       and pdl.label_id not in (
         select t.label_id from jsonb_to_recordset(p -> 'diet_labels') as t (label_id uuid, evidence text)
       );

    insert into public.product_diet_labels (product_id, label_id, evidence, approved_by, approved_at)
    select v_id, t.label_id, nullif(trim(t.evidence), ''), (select auth.uid()), now()
    from jsonb_to_recordset(p -> 'diet_labels') as t (label_id uuid, evidence text)
    on conflict (product_id, label_id) do update
      set evidence = excluded.evidence,
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at
      where public.product_diet_labels.evidence is distinct from excluded.evidence
         or public.product_diet_labels.approved_at is null;
  end if;

  if p ? 'campaign_ids' then
    delete from public.product_campaigns pc
     where pc.product_id = v_id
       and not exists (
         select 1 from jsonb_array_elements_text(p -> 'campaign_ids') as t (id)
         where t.id::uuid = pc.campaign_id
       );
    insert into public.product_campaigns (product_id, campaign_id)
    select distinct v_id, t.id::uuid
    from jsonb_array_elements_text(p -> 'campaign_ids') as t (id)
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

-- Troca rápida de situação (ativar, voltar para rascunho, arquivar).
create or replace function public.admin_set_product_status(p_product_id uuid, p_status public.product_status)
returns public.product_status
language plpgsql
set search_path = ''
as $$
declare
  v_row public.products;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode publicar ou arquivar produtos.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_row from public.products where id = p_product_id;
  if not found then
    raise exception 'Produto não encontrado.' using errcode = 'no_data_found';
  end if;

  if p_status = 'active' and v_row.category_id is null then
    raise exception 'Para ativar, escolha uma categoria.' using errcode = 'check_violation';
  end if;
  if p_status = 'active' and v_row.price_cents is null and not v_row.quote_only then
    raise exception 'Para ativar, informe o preço ou marque "sob orçamento".' using errcode = 'check_violation';
  end if;

  update public.products set status = p_status where id = p_product_id;
  return p_status;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões das funções
-- -----------------------------------------------------------------------------
revoke execute on function public.categories_inherit() from public, anon, authenticated;
revoke execute on function public.categories_propagate() from public, anon, authenticated;
revoke execute on function public.allergens_default_group() from public, anon, authenticated;

revoke execute on function public.slugify(text) from public, anon;
revoke execute on function public.unique_slug(text, regclass, uuid) from public, anon;
revoke execute on function public.admin_save_category(jsonb) from public, anon;
revoke execute on function public.admin_save_ingredient(jsonb) from public, anon;
revoke execute on function public.admin_save_campaign(jsonb) from public, anon;
revoke execute on function public.admin_save_product(jsonb) from public, anon;
revoke execute on function public.admin_set_product_status(uuid, public.product_status) from public, anon;

grant execute on function public.slugify(text) to authenticated;
grant execute on function public.unique_slug(text, regclass, uuid) to authenticated;
grant execute on function public.admin_save_category(jsonb) to authenticated;
grant execute on function public.admin_save_ingredient(jsonb) to authenticated;
grant execute on function public.admin_save_campaign(jsonb) to authenticated;
grant execute on function public.admin_save_product(jsonb) to authenticated;
grant execute on function public.admin_set_product_status(uuid, public.product_status) to authenticated;

-- -----------------------------------------------------------------------------
-- Views públicas são somente leitura
-- Projetos Supabase antigos concedem escrita a anon/authenticated em todo objeto
-- novo de public. Uma view que roda como dona não pode herdar isso.
-- -----------------------------------------------------------------------------
revoke all on public.v_public_producers, public.v_product_availability,
              public.v_store_categories, public.v_store_catalog
  from public, anon, authenticated;
grant select on public.v_public_producers, public.v_product_availability,
                public.v_store_categories, public.v_store_catalog
  to anon, authenticated;

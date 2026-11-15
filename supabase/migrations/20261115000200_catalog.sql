-- =============================================================================
-- 0002 · Catálogo: categorias, produtores, locais, produtos, mídia,
--        ingredientes, alergênicos e rótulos alimentares
-- Ver docs/DATABASE_SCHEMA.md §2 e docs/SECURITY_AND_PRIVACY.md §4 e §6.
-- =============================================================================

create type public.business_unit      as enum ('horta', 'cozinha', 'produtos', 'parceiros');
create type public.producer_kind      as enum ('proprio', 'fornecedor', 'parceiro');
create type public.certification_kind as enum ('none', 'ocs', 'certificado_auditoria', 'certificado_participativo');
create type public.location_kind      as enum ('horta', 'cozinha', 'deposito', 'parceiro');
create type public.product_kind       as enum ('simple', 'kit', 'box');
create type public.sale_unit          as enum ('un', 'kg', 'g', 'maco', 'pote', 'porcao', 'pacote');
create type public.product_status     as enum ('draft', 'active', 'archived');
create type public.stock_mode         as enum ('tracked', 'made_to_order', 'untracked');
create type public.storage_kind       as enum ('ambiente', 'refrigerado', 'congelado');
create type public.allergen_presence  as enum ('contains', 'may_contain');
create type public.allergen_source    as enum ('ingredient', 'cross_contamination', 'manual');

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(trim(name)) > 0),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  business_unit public.business_unit not null,
  parent_id     uuid references public.categories (id) on delete restrict,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.producers (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null check (length(trim(name)) > 0),
  kind                      public.producer_kind not null,
  city                      text,
  certification             public.certification_kind not null default 'none',
  certification_ref         text,
  certification_valid_until date,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint producers_certification_ref_required
    check (certification in ('none', 'ocs') or certification_ref is not null)
);

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  kind       public.location_kind not null,
  address    text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                   text not null check (length(trim(name)) > 0),
  short_description      text,
  description            text,
  business_unit          public.business_unit not null,
  category_id            uuid references public.categories (id) on delete restrict,
  producer_id            uuid references public.producers (id) on delete restrict,
  kind                   public.product_kind not null default 'simple',
  sale_unit              public.sale_unit not null,
  unit_size              numeric(12, 3) check (unit_size is null or unit_size > 0),
  price_cents            integer check (price_cents is null or price_cents >= 0),
  status                 public.product_status not null default 'draft',
  stock_mode             public.stock_mode not null default 'tracked',
  storage                public.storage_kind not null default 'ambiente',
  shelf_life_days        integer check (shelf_life_days is null or shelf_life_days > 0),
  conservation_info      text,
  yield_info             text,
  weight_grams           integer check (weight_grams is null or weight_grams > 0),
  portions               integer check (portions is null or portions > 0),
  seasonal_months        smallint[] check (seasonal_months is null or seasonal_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]),
  origin                 text,
  allergens_validated_at timestamptz,
  allergens_validated_by uuid references auth.users (id) on delete set null,
  min_lead_days          integer check (min_lead_days is null or min_lead_days >= 0),
  daily_limit            integer check (daily_limit is null or daily_limit > 0),
  search_vector          tsvector,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- Produto à venda precisa de preço e categoria (não inventamos preço: fica null no rascunho).
  constraint products_active_requires_price
    check (status <> 'active' or (price_cents is not null and category_id is not null))
);

create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category_id);
create index products_search_idx on public.products using gin (search_vector);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create table public.product_media (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text     text not null check (length(trim(alt_text)) > 0),
  sort_order   integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);

create unique index product_media_one_cover_idx
  on public.product_media (product_id) where is_cover;

create table public.allergens (
  id    uuid primary key default gen_random_uuid(),
  code  text not null unique check (code ~ '^[a-z0-9_]+$'),
  name  text not null,
  notes text
);

create table public.ingredients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  is_derived_from uuid references public.ingredients (id) on delete restrict,
  created_at      timestamptz not null default now(),
  constraint ingredients_not_self_derived check (is_derived_from is null or is_derived_from <> id)
);

create unique index ingredients_name_unique_idx on public.ingredients (lower(name));

create table public.ingredient_allergens (
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  allergen_id   uuid not null references public.allergens (id) on delete restrict,
  primary key (ingredient_id, allergen_id)
);

create table public.product_ingredients (
  product_id    uuid not null references public.products (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  position      integer not null default 0,
  primary key (product_id, ingredient_id)
);

create table public.product_allergens (
  product_id  uuid not null references public.products (id) on delete cascade,
  allergen_id uuid not null references public.allergens (id) on delete restrict,
  presence    public.allergen_presence not null,
  source      public.allergen_source not null,
  created_at  timestamptz not null default now(),
  primary key (product_id, allergen_id, presence, source),
  -- "Pode conter" vem do processo produtivo; "contém" vem de ingrediente ou declaração manual.
  constraint product_allergens_source_matches_presence check (
    (presence = 'may_contain' and source = 'cross_contamination')
    or (presence = 'contains' and source in ('ingredient', 'manual'))
  )
);

create table public.diet_labels (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[a-z0-9_]+$'),
  name              text not null,
  requires_evidence boolean not null default true
);

create table public.product_diet_labels (
  product_id  uuid not null references public.products (id) on delete cascade,
  label_id    uuid not null references public.diet_labels (id) on delete restrict,
  evidence    text,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  primary key (product_id, label_id),
  constraint product_diet_labels_approval_pair
    check ((approved_at is null) = (approved_by is null))
);

-- -----------------------------------------------------------------------------
-- Triggers: updated_at, busca e auditoria
-- -----------------------------------------------------------------------------
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger producers_updated_at before update on public.producers
  for each row execute function public.set_updated_at();
create trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.products_set_search_vector()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(new.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(new.short_description, ''))), 'B') ||
    setweight(to_tsvector('portuguese', extensions.unaccent(coalesce(new.description, ''))), 'C');
  return new;
end;
$$;

create trigger products_search_vector
  before insert or update of name, short_description, description on public.products
  for each row execute function public.products_set_search_vector();

create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.audit_row();
create trigger producers_audit after insert or update or delete on public.producers
  for each row execute function public.audit_row();
create trigger locations_audit after insert or update or delete on public.locations
  for each row execute function public.audit_row();
create trigger products_audit after insert or update or delete on public.products
  for each row execute function public.audit_row();
create trigger product_media_audit after insert or update or delete on public.product_media
  for each row execute function public.audit_row();
create trigger product_ingredients_audit after insert or update or delete on public.product_ingredients
  for each row execute function public.audit_row('product_id');
create trigger product_allergens_audit after insert or update or delete on public.product_allergens
  for each row execute function public.audit_row('product_id');
create trigger product_diet_labels_audit after insert or update or delete on public.product_diet_labels
  for each row execute function public.audit_row('product_id');

-- -----------------------------------------------------------------------------
-- Regra: termo "orgânico" (SECURITY_AND_PRIVACY §6)
-- Só pode aparecer no nome se o produtor tiver certificação válida
-- (auditoria ou participativa). OCS exige validação caso a caso: fica bloqueado.
-- -----------------------------------------------------------------------------
create or replace function public.products_check_organic_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  if extensions.unaccent(lower(new.name)) !~ 'organic' then
    return new;
  end if;

  select p.certification in ('certificado_auditoria', 'certificado_participativo')
         and (p.certification_valid_until is null or p.certification_valid_until >= current_date)
    into v_ok
  from public.producers p
  where p.id = new.producer_id;

  if not coalesce(v_ok, false) then
    raise exception 'O termo "orgânico" exige produtor com certificação válida (ver SECURITY_AND_PRIVACY §6).'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger products_organic_claim
  before insert or update of name, producer_id on public.products
  for each row execute function public.products_check_organic_claim();

-- -----------------------------------------------------------------------------
-- Alergênicos determinísticos (SECURITY_AND_PRIVACY §4)
-- 1) Linhas source='ingredient' são recalculadas a partir dos ingredientes,
--    incluindo os ingredientes de origem (derivados, em qualquer profundidade).
-- 2) Qualquer mudança em ingredientes/alergênicos do produto invalida a validação.
-- -----------------------------------------------------------------------------
create or replace function public.refresh_product_ingredient_allergens(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.product_allergens
  where product_id = p_product_id and source = 'ingredient';

  insert into public.product_allergens (product_id, allergen_id, presence, source)
  with recursive lineage (ingredient_id) as (
    select pi.ingredient_id
    from public.product_ingredients pi
    where pi.product_id = p_product_id
    union
    select i.is_derived_from
    from public.ingredients i
    join lineage l on l.ingredient_id = i.id
    where i.is_derived_from is not null
  )
  select distinct p_product_id, ia.allergen_id, 'contains'::public.allergen_presence, 'ingredient'::public.allergen_source
  from lineage l
  join public.ingredient_allergens ia on ia.ingredient_id = l.ingredient_id;
end;
$$;

create or replace function public.invalidate_product_allergens(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products
     set allergens_validated_at = null,
         allergens_validated_by = null
   where id = p_product_id
     and allergens_validated_at is not null;
$$;

create or replace function public.product_ingredients_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  perform public.refresh_product_ingredient_allergens(v_product);
  perform public.invalidate_product_allergens(v_product);
  return null;
end;
$$;

create trigger product_ingredients_refresh
  after insert or update or delete on public.product_ingredients
  for each row execute function public.product_ingredients_changed();

create or replace function public.product_allergens_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.invalidate_product_allergens(coalesce(new.product_id, old.product_id));
  return null;
end;
$$;

create trigger product_allergens_invalidate
  after insert or update or delete on public.product_allergens
  for each row execute function public.product_allergens_changed();

-- Mudou o mapa ingrediente → alergênico (ou a origem de um ingrediente):
-- recalcula todos os produtos que usam aquele ingrediente ou seus derivados.
create or replace function public.ingredient_allergen_map_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- to_jsonb evita referenciar colunas que não existem na tabela do trigger.
  v_row        jsonb := to_jsonb(coalesce(new, old));
  v_ingredient uuid  := coalesce(v_row ->> 'ingredient_id', v_row ->> 'id')::uuid;
  r record;
begin
  for r in
    with recursive descendants (id) as (
      select v_ingredient
      union
      select i.id from public.ingredients i join descendants d on i.is_derived_from = d.id
    )
    select distinct pi.product_id
    from public.product_ingredients pi
    join descendants d on d.id = pi.ingredient_id
  loop
    perform public.refresh_product_ingredient_allergens(r.product_id);
    perform public.invalidate_product_allergens(r.product_id);
  end loop;
  return null;
end;
$$;

create trigger ingredient_allergens_refresh
  after insert or update or delete on public.ingredient_allergens
  for each row execute function public.ingredient_allergen_map_changed();

create trigger ingredients_lineage_refresh
  after update of is_derived_from on public.ingredients
  for each row execute function public.ingredient_allergen_map_changed();

-- Validar a ficha de alergênicos de um produto (owner/admin).
create or replace function public.validate_product_allergens(p_product_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
begin
  if not public.is_manager() then
    raise exception 'Apenas owner/admin podem validar alergênicos.' using errcode = 'insufficient_privilege';
  end if;

  update public.products
     set allergens_validated_at = v_now,
         allergens_validated_by = (select auth.uid())
   where id = p_product_id;

  if not found then
    raise exception 'Produto não encontrado.' using errcode = 'no_data_found';
  end if;

  return v_now;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.categories           enable row level security;
alter table public.producers            enable row level security;
alter table public.locations            enable row level security;
alter table public.products             enable row level security;
alter table public.product_media        enable row level security;
alter table public.allergens            enable row level security;
alter table public.ingredients          enable row level security;
alter table public.ingredient_allergens enable row level security;
alter table public.product_ingredients  enable row level security;
alter table public.product_allergens    enable row level security;
alter table public.diet_labels          enable row level security;
alter table public.product_diet_labels  enable row level security;

-- Produto visível para a loja: ativo. A equipe vê tudo.
create or replace function public.product_is_public(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.products p where p.id = p_product_id and p.status = 'active');
$$;

-- Leitura
create policy "categories: leitura" on public.categories for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "producers: leitura" on public.producers for select to anon, authenticated
  using (true);
create policy "locations: equipe lê" on public.locations for select to authenticated
  using (public.is_staff());
create policy "products: leitura" on public.products for select to anon, authenticated
  using (status = 'active' or public.is_staff());
create policy "product_media: leitura" on public.product_media for select to anon, authenticated
  using (public.product_is_public(product_id) or public.is_staff());
create policy "allergens: leitura" on public.allergens for select to anon, authenticated
  using (true);
create policy "ingredients: leitura" on public.ingredients for select to anon, authenticated
  using (true);
create policy "ingredient_allergens: leitura" on public.ingredient_allergens for select to anon, authenticated
  using (true);
create policy "product_ingredients: leitura" on public.product_ingredients for select to anon, authenticated
  using (public.product_is_public(product_id) or public.is_staff());
create policy "product_allergens: leitura" on public.product_allergens for select to anon, authenticated
  using (public.product_is_public(product_id) or public.is_staff());
create policy "diet_labels: leitura" on public.diet_labels for select to anon, authenticated
  using (true);
create policy "product_diet_labels: leitura" on public.product_diet_labels for select to anon, authenticated
  using ((approved_at is not null and public.product_is_public(product_id)) or public.is_staff());

-- Escrita: gestores (owner/admin) mantêm o catálogo.
create policy "categories: gestores escrevem" on public.categories for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "producers: gestores escrevem" on public.producers for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "locations: gestores escrevem" on public.locations for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "products: gestores escrevem" on public.products for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "product_media: gestores escrevem" on public.product_media for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "allergens: gestores escrevem" on public.allergens for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "ingredients: gestores escrevem" on public.ingredients for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "ingredient_allergens: gestores escrevem" on public.ingredient_allergens for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "product_ingredients: gestores escrevem" on public.product_ingredients for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "diet_labels: gestores escrevem" on public.diet_labels for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "product_diet_labels: gestores escrevem" on public.product_diet_labels for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- product_allergens: só declarações manuais/contaminação cruzada; as de ingrediente são do trigger.
create policy "product_allergens: gestores declaram" on public.product_allergens for insert to authenticated
  with check (public.is_manager() and source <> 'ingredient');
create policy "product_allergens: gestores removem declarações" on public.product_allergens for delete to authenticated
  using (public.is_manager() and source <> 'ingredient');

-- Operação (Chef) pode criar rascunho de produto, sem publicar.
create policy "products: operação cria rascunho" on public.products for insert to authenticated
  with check (public.has_role(array['operacao']::public.staff_role[]) and status = 'draft');

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant select on
  public.categories, public.producers, public.products, public.product_media,
  public.allergens, public.ingredients, public.ingredient_allergens,
  public.product_ingredients, public.product_allergens, public.diet_labels,
  public.product_diet_labels
to anon, authenticated;

grant select on public.locations to authenticated;

grant insert, update, delete on
  public.categories, public.producers, public.locations, public.products,
  public.product_media, public.allergens, public.ingredients,
  public.ingredient_allergens, public.product_ingredients, public.diet_labels,
  public.product_diet_labels
to authenticated;

grant insert, delete on public.product_allergens to authenticated;

revoke execute on function public.refresh_product_ingredient_allergens(uuid) from public, anon, authenticated;
revoke execute on function public.invalidate_product_allergens(uuid) from public, anon, authenticated;
revoke execute on function public.product_ingredients_changed() from public, anon, authenticated;
revoke execute on function public.product_allergens_changed() from public, anon, authenticated;
revoke execute on function public.ingredient_allergen_map_changed() from public, anon, authenticated;
revoke execute on function public.validate_product_allergens(uuid) from public, anon;
grant execute on function public.validate_product_allergens(uuid) to authenticated;
grant execute on function public.product_is_public(uuid) to anon, authenticated;

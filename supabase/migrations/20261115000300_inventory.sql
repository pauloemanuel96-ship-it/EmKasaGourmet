-- =============================================================================
-- 0003 · Estoque como livro-razão (D-006)
-- Ver docs/DATABASE_SCHEMA.md §3.
--
-- Convenção de sinais em inventory_movements.quantity:
--   stock_in, harvest, production, return  → positivo (entra no on_hand)
--   loss                                   → negativo (sai do on_hand)
--   adjustment                             → positivo ou negativo
--   reserve, release, sale                 → positivo (quantidade da reserva)
--     reserve: reserved += q
--     release: reserved -= q
--     sale:    reserved -= q e on_hand -= q (converte reserva em venda)
-- =============================================================================

create type public.movement_reason as enum (
  'stock_in', 'harvest', 'production', 'sale', 'reserve',
  'release', 'loss', 'adjustment', 'return'
);

create table public.stock_levels (
  product_id  uuid not null references public.products (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  on_hand     numeric(12, 3) not null default 0,
  reserved    numeric(12, 3) not null default 0,
  available   numeric(12, 3) generated always as (on_hand - reserved) stored,
  updated_at  timestamptz not null default now(),
  primary key (product_id, location_id),
  -- Última barreira contra venda de estoque inexistente (RN-01).
  constraint stock_levels_non_negative check (on_hand >= 0 and reserved >= 0 and reserved <= on_hand)
);

create table public.inventory_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  quantity    numeric(12, 3) not null check (quantity <> 0),
  reason      public.movement_reason not null,
  order_id    uuid,       -- FK adicionada na migration de pedidos (Fase 2)
  lot_id      uuid,       -- FK adicionada com a tabela lots (Fase 2)
  actor_id    uuid default auth.uid(),
  source      public.change_source not null default 'panel',
  note        text,
  created_at  timestamptz not null default now(),
  constraint inventory_movements_sign check (
    case reason
      when 'stock_in'   then quantity > 0
      when 'harvest'    then quantity > 0
      when 'production' then quantity > 0
      when 'return'     then quantity > 0
      when 'loss'       then quantity < 0
      when 'adjustment' then true
      else quantity > 0  -- reserve, release, sale
    end
  )
);

create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);
create index inventory_movements_order_idx on public.inventory_movements (order_id) where order_id is not null;

-- Aplica cada movimento ao saldo. Roda dentro da mesma transação do insert:
-- se o saldo ficar negativo, o CHECK falha e o movimento é desfeito.
create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d_on_hand  numeric(12, 3) := 0;
  d_reserved numeric(12, 3) := 0;
begin
  case new.reason
    when 'reserve' then d_reserved := new.quantity;
    when 'release' then d_reserved := -new.quantity;
    when 'sale'    then d_reserved := -new.quantity; d_on_hand := -new.quantity;
    else                d_on_hand  := new.quantity;
  end case;

  -- UPDATE primeiro: com INSERT ... ON CONFLICT o CHECK seria avaliado na linha
  -- proposta (só com o delta) e falharia em toda saída de estoque.
  update public.stock_levels
     set on_hand    = on_hand + d_on_hand,
         reserved   = reserved + d_reserved,
         updated_at = now()
   where product_id = new.product_id
     and location_id = new.location_id;

  if not found then
    insert into public.stock_levels (product_id, location_id, on_hand, reserved)
    values (new.product_id, new.location_id, d_on_hand, d_reserved);
  end if;

  return null;
exception
  when check_violation then
    raise exception 'Estoque insuficiente para esta operação.'
      using errcode = 'check_violation',
            detail  = format('produto=%s local=%s motivo=%s quantidade=%s',
                             new.product_id, new.location_id, new.reason, new.quantity);
end;
$$;

create trigger inventory_movements_apply
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

-- O livro-razão é imutável. Correção = novo movimento 'adjustment'.
create or replace function public.forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'A tabela % é somente inserção. Registre um novo movimento de ajuste.', tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

create trigger inventory_movements_immutable
  before update or delete on public.inventory_movements
  for each row execute function public.forbid_mutation();

create trigger audit_log_immutable
  before update or delete on public.audit_log
  for each row execute function public.forbid_mutation();

-- -----------------------------------------------------------------------------
-- Registro de movimentação pelo painel / assistente (RF-A04)
-- p_mode = 'delta'    → quantidade com o sinal do motivo
-- p_mode = 'absolute' → "temos 8": calcula o ajuste necessário com lock de linha
-- p_location_id null  → usa o único local ativo (erro se houver mais de um)
-- -----------------------------------------------------------------------------
create or replace function public.register_stock_movement(
  p_product_id  uuid,
  p_quantity    numeric,
  p_reason      public.movement_reason,
  p_note        text default null,
  p_mode        text default 'delta',
  p_location_id uuid default null
)
returns public.stock_levels
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location uuid := p_location_id;
  v_current  numeric(12, 3);
  v_delta    numeric(12, 3);
  v_result   public.stock_levels;
begin
  if not public.has_role(array['owner', 'admin', 'operacao']::public.staff_role[]) then
    raise exception 'Sem permissão para movimentar estoque.' using errcode = 'insufficient_privilege';
  end if;

  if p_reason in ('sale', 'reserve', 'release') then
    raise exception 'Motivo % é exclusivo do sistema de pedidos.', p_reason using errcode = 'invalid_parameter_value';
  end if;

  if p_mode not in ('delta', 'absolute') then
    raise exception 'Modo inválido: %', p_mode using errcode = 'invalid_parameter_value';
  end if;

  if not exists (
    select 1 from public.products
    where id = p_product_id and stock_mode = 'tracked' and status <> 'archived'
  ) then
    raise exception 'Produto inexistente, arquivado ou sem controle de estoque.' using errcode = 'invalid_parameter_value';
  end if;

  if v_location is null then
    if (select count(*) from public.locations where is_active) = 1 then
      select id into v_location from public.locations where is_active;
    end if;

    if v_location is null then
      raise exception 'Informe o local: existe mais de um local ativo (ou nenhum).' using errcode = 'invalid_parameter_value';
    end if;
  end if;

  -- Garante a linha de saldo e trava para evitar corrida com outros movimentos.
  insert into public.stock_levels (product_id, location_id)
  values (p_product_id, v_location)
  on conflict do nothing;

  select on_hand into v_current
  from public.stock_levels
  where product_id = p_product_id and location_id = v_location
  for update;

  if p_mode = 'absolute' then
    if p_quantity < 0 then
      raise exception 'Quantidade absoluta não pode ser negativa.' using errcode = 'invalid_parameter_value';
    end if;
    v_delta := p_quantity - v_current;
    if v_delta = 0 then
      select * into v_result from public.stock_levels
      where product_id = p_product_id and location_id = v_location;
      return v_result;
    end if;
    p_reason := 'adjustment';
  else
    v_delta := p_quantity;
  end if;

  insert into public.inventory_movements (product_id, location_id, quantity, reason, source, note)
  values (p_product_id, v_location, v_delta, p_reason, public.current_change_source(), p_note);

  select * into v_result from public.stock_levels
  where product_id = p_product_id and location_id = v_location;
  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Disponibilidade para a loja (catálogo ≠ disponibilidade: RN-04)
-- -----------------------------------------------------------------------------
create view public.v_product_availability
with (security_invoker = true)
as
select
  p.id as product_id,
  p.status,
  p.stock_mode,
  coalesce(sum(s.available), 0) as available_quantity,
  (p.status = 'active' and (p.stock_mode <> 'tracked' or coalesce(sum(s.available), 0) > 0)) as is_available
from public.products p
left join public.stock_levels s on s.product_id = p.id
group by p.id;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.stock_levels        enable row level security;
alter table public.inventory_movements enable row level security;

create policy "stock_levels: leitura" on public.stock_levels for select to anon, authenticated
  using (public.product_is_public(product_id) or public.is_staff());

create policy "inventory_movements: equipe lê" on public.inventory_movements for select to authenticated
  using (public.is_staff());

-- Sem policies de escrita: só as funções security definer movimentam estoque.
grant select on public.stock_levels to anon, authenticated;
grant select on public.inventory_movements to authenticated;
grant select on public.v_product_availability to anon, authenticated;

revoke execute on function public.apply_inventory_movement() from public, anon, authenticated;
revoke execute on function public.register_stock_movement(uuid, numeric, public.movement_reason, text, text, uuid) from public, anon;
grant execute on function public.register_stock_movement(uuid, numeric, public.movement_reason, text, text, uuid) to authenticated;

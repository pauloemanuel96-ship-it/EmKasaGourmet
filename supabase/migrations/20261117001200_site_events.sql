-- =============================================================================
-- Emkasa Gourmet — Migration 0012: registro de visitas e funil (D-047)
-- Só grava quem permitiu "Medição" no aviso de cookies (a rota do servidor
-- confere o cookie antes de chamar a função). Não guarda IP nem nome do
-- aparelho: só um código aleatório do navegador e da visita. Só o dono (owner)
-- lê. Eventos com mais de 13 meses são apagados sozinhos.
-- =============================================================================

create table public.site_events (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  -- Código aleatório guardado no navegador (some quando a pessoa retira a permissão).
  visitor_id   uuid not null,
  -- Uma visita: renova depois de 30 minutos parado.
  session_id   uuid not null,
  kind         text not null check (kind in ('view', 'add_to_cart', 'remove_from_cart', 'order_placed', 'lead')),
  path         text not null check (char_length(path) between 1 and 300),
  product_slug text check (product_slug is null or char_length(product_slug) <= 120),
  quantity     integer check (quantity is null or quantity between 1 and 999),
  -- De onde veio a visita (campanha, site de origem ou "direto").
  source       text check (source is null or char_length(source) <= 120),
  medium       text check (medium is null or char_length(medium) <= 60),
  campaign     text check (campaign is null or char_length(campaign) <= 120),
  device       text check (device is null or device in ('celular', 'tablet', 'computador')),
  -- Preenchido pelo banco quando a pessoa está logada.
  user_id      uuid references auth.users (id) on delete set null
);

create index site_events_at_idx on public.site_events (at desc);
create index site_events_session_idx on public.site_events (session_id, at);
create index site_events_kind_at_idx on public.site_events (kind, at desc);

alter table public.site_events enable row level security;

-- Só o dono lê e apaga. Ninguém insere direto: só pela função abaixo.
create policy site_events_select_owner on public.site_events
  for select to authenticated
  using (public.has_role(array['owner']::public.staff_role[]));
create policy site_events_delete_owner on public.site_events
  for delete to authenticated
  using (public.has_role(array['owner']::public.staff_role[]));

revoke all on public.site_events from public, anon, authenticated;
grant select, delete on public.site_events to authenticated;

-- Grava um lote de até 20 eventos. A hora e a pessoa logada vêm do banco,
-- nunca do navegador. Evento de tipo desconhecido é ignorado.
create or replace function public.track_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if jsonb_typeof(p_events) is distinct from 'array' then
    raise exception 'Lote inválido.' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_events) > 20 then
    raise exception 'Lote grande demais.' using errcode = 'check_violation';
  end if;

  insert into public.site_events
    (visitor_id, session_id, kind, path, product_slug, quantity, source, medium, campaign, device, user_id)
  select e.visitor_id, e.session_id, e.kind, left(e.path, 300),
         nullif(left(e.product_slug, 120), ''),
         case when e.quantity between 1 and 999 then e.quantity end,
         nullif(left(e.source, 120), ''), nullif(left(e.medium, 60), ''),
         nullif(left(e.campaign, 120), ''),
         case when e.device in ('celular', 'tablet', 'computador') then e.device end,
         auth.uid()
  from jsonb_to_recordset(p_events) as e(
    visitor_id uuid, session_id uuid, kind text, path text, product_slug text,
    quantity integer, source text, medium text, campaign text, device text
  )
  where e.visitor_id is not null
    and e.session_id is not null
    and e.kind in ('view', 'add_to_cart', 'remove_from_cart', 'order_placed', 'lead')
    and coalesce(e.path, '') <> '';
  get diagnostics v_count = row_count;

  -- Limpeza sem agendador: de vez em quando, apaga o que passou de 13 meses.
  if random() < 0.002 then
    delete from public.site_events where at < now() - interval '13 months';
  end if;

  return v_count;
end;
$$;

revoke all on function public.track_events(jsonb) from public;
grant execute on function public.track_events(jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Relatório do painel master (só owner). Dias contados no horário de Brasília.
-- -----------------------------------------------------------------------------
create or replace function public.traffic_report(p_days integer default 7)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_days  integer := least(greatest(coalesce(p_days, 7), 1), 365);
  v_since timestamptz;
  v_tz    text := 'America/Sao_Paulo';
  v_out   jsonb;
begin
  if not public.has_role(array['owner']::public.staff_role[]) then
    raise exception 'Só o dono vê o tráfego.' using errcode = '42501';
  end if;
  v_since := date_trunc('day', now() at time zone v_tz) at time zone v_tz
             - make_interval(days => v_days - 1);

  with ev as (
    select * from public.site_events where at >= v_since
  ),
  -- Uma linha por visita: origem e aparelho do primeiro evento, até onde chegou.
  sess as (
    select session_id,
           min(at) as started,
           max(at) as last_at,
           (array_agg(visitor_id order by at))[1] as visitor_id,
           (array_agg(coalesce(source, 'direto') order by at))[1] as source,
           (array_agg(medium order by at))[1] as medium,
           (array_agg(device order by at))[1] as device,
           (array_agg(path order by at))[1] as landing,
           max(user_id::text)::uuid as user_id,
           count(*) filter (where kind = 'view') as views,
           bool_or(kind = 'view' and path like '/produto/%') as saw_product,
           bool_or(kind = 'add_to_cart') as added,
           bool_or(kind = 'view' and path like '/checkout%') as checkout,
           bool_or(kind = 'order_placed') as ordered,
           bool_or(kind = 'lead') as lead
    from ev
    group by session_id
  )
  select jsonb_build_object(
    'days', v_days,
    'since', v_since,
    'totals', (
      select jsonb_build_object(
        'visitors', count(distinct visitor_id),
        'sessions', count(*),
        'views', coalesce(sum(views), 0),
        'logged', count(distinct user_id),
        'leads', count(*) filter (where lead),
        'orders', count(*) filter (where ordered)
      ) from sess
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'visitors', coalesce(x.visitors, 0), 'views', coalesce(x.views, 0)) order by d.day), '[]')
      from (
        select generate_series(
          (v_since at time zone v_tz)::date,
          (now() at time zone v_tz)::date,
          interval '1 day'
        )::date as day
      ) d
      left join (
        select (at at time zone v_tz)::date as day,
               count(distinct visitor_id) as visitors,
               count(*) filter (where kind = 'view') as views
        from ev group by 1
      ) x on x.day = d.day
    ),
    'funnel', (
      select jsonb_build_array(
        jsonb_build_object('step', 'Visitou a loja', 'sessions', count(*)),
        jsonb_build_object('step', 'Viu um produto', 'sessions', count(*) filter (where saw_product)),
        jsonb_build_object('step', 'Pôs no carrinho', 'sessions', count(*) filter (where added)),
        jsonb_build_object('step', 'Abriu o checkout', 'sessions', count(*) filter (where checkout)),
        jsonb_build_object('step', 'Fez o pedido', 'sessions', count(*) filter (where ordered))
      ) from sess
    ),
    'pages', (
      select coalesce(jsonb_agg(p order by p.views desc), '[]') from (
        select path, count(*) as views, count(distinct visitor_id) as visitors
        from ev where kind = 'view'
        group by path order by count(*) desc limit 10
      ) p
    ),
    'sources', (
      select coalesce(jsonb_agg(s order by s.sessions desc), '[]') from (
        select source, max(medium) as medium, count(*) as sessions,
               count(*) filter (where added) as carts,
               count(*) filter (where ordered or lead) as conversions
        from sess group by source order by count(*) desc limit 10
      ) s
    ),
    'devices', (
      select coalesce(jsonb_agg(d order by d.sessions desc), '[]') from (
        select coalesce(device, 'desconhecido') as device, count(*) as sessions
        from sess group by 1
      ) d
    ),
    'products', (
      select coalesce(jsonb_agg(p order by p.added desc), '[]') from (
        select e.product_slug as slug,
               coalesce(pr.name, e.product_slug) as name,
               coalesce(sum(e.quantity) filter (where e.kind = 'add_to_cart'), 0) as added,
               coalesce(sum(e.quantity) filter (where e.kind = 'remove_from_cart'), 0) as removed
        from ev e
        left join public.products pr on pr.slug = e.product_slug
        where e.product_slug is not null
          and e.kind in ('add_to_cart', 'remove_from_cart')
        group by e.product_slug, pr.name
        order by 3 desc limit 10
      ) p
    ),
    -- Carrinho abandonado: pôs no carrinho, não pediu e está parado há 1 hora.
    'abandoned', (
      select jsonb_build_object(
        'sessions', count(*),
        'logged', count(*) filter (where user_id is not null)
      ) from sess
      where added and not ordered and last_at < now() - interval '1 hour'
    ),
    'recent', (
      select coalesce(jsonb_agg(r order by r.started desc), '[]') from (
        select s.started, s.source, s.device, s.landing, s.views,
               c.name as customer,
               case when s.ordered then 'Fez o pedido'
                    when s.checkout then 'Abriu o checkout'
                    when s.added then 'Pôs no carrinho'
                    when s.saw_product then 'Viu um produto'
                    else 'Visitou a loja' end as reached
        from sess s
        left join public.customers c on c.id = s.user_id
        order by s.started desc limit 20
      ) r
    )
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.traffic_report(integer) from public;
grant execute on function public.traffic_report(integer) to authenticated;

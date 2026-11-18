-- =============================================================================
-- Emkasa Gourmet — Migration 0013: Chef Emkasa, pedidos de proposta (D-049)
-- Quem quer a Chef em casa pede uma proposta pelo site. Ainda não há preço,
-- agenda nem bairros definidos: a equipe responde cada pedido. Dado pessoal:
-- só owner e admin leem; restrições de saúde só entram com autorização escrita.
-- =============================================================================

create table public.chef_requests (
  id                      uuid primary key default gen_random_uuid(),
  status                  text not null default 'novo'
                            check (status in ('novo', 'em_conversa', 'proposta_enviada', 'confirmado', 'realizado', 'cancelado')),
  format                  text not null check (format in ('ocasiao', 'semana', 'assinatura')),
  desired_date            date,
  period                  text check (period is null or period in ('manha', 'almoco', 'tarde', 'jantar')),
  neighborhood            text not null check (char_length(neighborhood) between 2 and 80),
  city                    text not null default 'Aracaju' check (char_length(city) between 2 and 60),
  people                  integer not null check (people between 1 and 40),
  notes                   text check (notes is null or char_length(notes) <= 1000),
  -- Alergias e restrições de quem vai comer: dado de saúde (LGPD, art. 11).
  restrictions            text check (restrictions is null or char_length(restrictions) <= 600),
  restrictions_consent_at timestamptz,
  name                    text not null check (char_length(name) between 2 and 80),
  phone                   text not null check (phone ~ '^[0-9]{10,13}$'),
  email                   text check (email is null or char_length(email) <= 160),
  -- Preenchido pelo banco quando a pessoa está logada.
  user_id                 uuid references auth.users (id) on delete set null,
  staff_notes             text check (staff_notes is null or char_length(staff_notes) <= 2000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint chef_requests_health_consent
    check (restrictions is null or restrictions_consent_at is not null)
);

create index chef_requests_created_idx on public.chef_requests (created_at desc);
create index chef_requests_status_idx on public.chef_requests (status, created_at desc);

create trigger chef_requests_set_updated_at
  before update on public.chef_requests
  for each row execute function public.set_updated_at();

create trigger chef_requests_audit
  after update or delete on public.chef_requests
  for each row execute function public.audit_row('id');

alter table public.chef_requests enable row level security;

-- owner e admin leem, mudam o andamento e apagam. A pessoa logada vê os seus.
create policy chef_requests_select_manager on public.chef_requests
  for select to authenticated using (public.is_manager());
create policy chef_requests_select_own on public.chef_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy chef_requests_update_manager on public.chef_requests
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy chef_requests_delete_manager on public.chef_requests
  for delete to authenticated using (public.is_manager());

revoke all on public.chef_requests from public, anon, authenticated;
grant select, delete on public.chef_requests to authenticated;
-- A equipe só mexe no andamento e nas anotações internas.
grant update (status, staff_notes) on public.chef_requests to authenticated;

-- Pedido pelo site (com ou sem login). security definer: grava sem dar acesso
-- de leitura a quem pediu. Restrição de saúde sem autorização é recusada.
-- Limite simples contra abuso: 3 pedidos abertos por telefone.
create or replace function public.request_chef(
  p_format       text,
  p_desired_date date,
  p_period       text,
  p_neighborhood text,
  p_people       integer,
  p_notes        text,
  p_restrictions text,
  p_health_consent boolean,
  p_name         text,
  p_phone        text,
  p_email        text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_restr text := nullif(trim(coalesce(p_restrictions, '')), '');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_id    uuid;
begin
  if v_restr is not null and p_health_consent is not true then
    raise exception 'Para enviar alergias e restrições, é preciso autorizar.' using errcode = 'check_violation';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido.' using errcode = 'check_violation';
  end if;
  if p_desired_date is not null and p_desired_date < (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data precisa ser hoje ou depois.' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.chef_requests
       where phone = v_phone and status in ('novo', 'em_conversa')) >= 3 then
    raise exception 'Já recebemos seus pedidos. A equipe vai falar com você.' using errcode = 'check_violation';
  end if;

  insert into public.chef_requests (
    format, desired_date, period, neighborhood, people, notes,
    restrictions, restrictions_consent_at, name, phone, email, user_id
  ) values (
    p_format, p_desired_date, nullif(p_period, ''), trim(p_neighborhood), p_people,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_restr, case when v_restr is not null then now() end,
    trim(p_name), v_phone, v_email, auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.request_chef(text, date, text, text, integer, text, text, boolean, text, text, text) from public;
grant execute on function public.request_chef(text, date, text, text, integer, text, text, boolean, text, text, text) to anon, authenticated;

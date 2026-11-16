-- =============================================================================
-- Emkasa Gourmet — Migration 0008: contatos captados (leads) e origem (D-037)
-- Quem se cadastra no aviso de ofertas da loja. Dado pessoal: só entra com
-- consentimento, só a administração lê, e dá para apagar a pedido da pessoa.
-- =============================================================================

create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 80),
  email             text not null check (char_length(email) <= 160),
  phone             text check (phone is null or phone ~ '^[0-9]{10,13}$'),
  -- Chamada que captou o contato (ex.: 'black-friday', 'geral').
  campaign          text not null default 'geral' check (char_length(campaign) <= 40),
  -- LGPD: sem consentimento não existe linha. Guardamos o texto aceito e a hora.
  consent_marketing boolean not null check (consent_marketing),
  consent_text      text not null check (char_length(consent_text) between 10 and 400),
  consent_at        timestamptz not null default now(),
  -- Origem do primeiro acesso (de onde a pessoa veio).
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  gclid             text,
  fbclid            text,
  referrer          text,
  landing_path      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index leads_email_key on public.leads (lower(email));
create index leads_created_at_idx on public.leads (created_at desc);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Apagar um contato (pedido do titular) fica registrado na auditoria.
create trigger leads_audit
  after delete on public.leads
  for each row execute function public.audit_row('id');

alter table public.leads enable row level security;

-- Só owner e admin leem e apagam. Ninguém insere direto: só pela função abaixo.
create policy leads_select_manager on public.leads
  for select to authenticated using (public.is_manager());
create policy leads_delete_manager on public.leads
  for delete to authenticated using (public.is_manager());

revoke all on public.leads from public, anon, authenticated;
grant select, delete on public.leads to authenticated;

-- Cadastro pelo site (visitante sem login). security definer: grava sem dar
-- nenhum acesso de leitura ao visitante. O mesmo e-mail atualiza o cadastro em
-- vez de duplicar, e a origem do primeiro acesso nunca é sobrescrita.
create or replace function public.capture_lead(
  p_name         text,
  p_email        text,
  p_phone        text,
  p_campaign     text,
  p_consent      boolean,
  p_consent_text text,
  p_origin       jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := trim(coalesce(p_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
  v_o     jsonb := coalesce(p_origin, '{}'::jsonb);
begin
  if p_consent is not true then
    raise exception 'É preciso aceitar receber as ofertas.' using errcode = 'check_violation';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido.' using errcode = 'check_violation';
  end if;

  insert into public.leads (
    name, email, phone, campaign, consent_marketing, consent_text,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    gclid, fbclid, referrer, landing_path
  ) values (
    v_name, v_email, v_phone, coalesce(nullif(trim(p_campaign), ''), 'geral'), true, trim(p_consent_text),
    left(v_o->>'utm_source', 200), left(v_o->>'utm_medium', 200), left(v_o->>'utm_campaign', 200),
    left(v_o->>'utm_content', 200), left(v_o->>'utm_term', 200),
    left(v_o->>'gclid', 200), left(v_o->>'fbclid', 200),
    left(v_o->>'referrer', 300), left(v_o->>'landing_path', 300)
  )
  on conflict (lower(email)) do update
    set name         = excluded.name,
        phone        = coalesce(excluded.phone, public.leads.phone),
        campaign     = excluded.campaign,
        consent_text = excluded.consent_text,
        consent_at   = now();
end;
$$;

revoke execute on function public.capture_lead(text, text, text, text, boolean, text, jsonb) from public;
grant execute on function public.capture_lead(text, text, text, text, boolean, text, jsonb) to anon, authenticated;

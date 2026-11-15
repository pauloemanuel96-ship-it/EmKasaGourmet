-- =============================================================================
-- 0007 · Fotos de produto (Biblioteca de Mídia)
-- Arquivos no Supabase Storage (bucket público "produtos"); o banco guarda só
-- o caminho, o texto alternativo e o papel da foto. Nunca a imagem em si.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Bucket: leitura pública (fotos da loja), até 5 MB, só imagem.
-- O painel converte para WebP antes de enviar; os outros formatos ficam
-- aceitos para não travar quem subir uma foto pelo painel do Supabase.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Só a administração envia, troca e apaga. A equipe pode listar (Biblioteca).
-- A leitura pública dos arquivos vem do bucket ser público, não destas regras.
create policy "produtos: equipe lista"
  on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and public.is_staff());
create policy "produtos: administração envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and public.is_manager());
create policy "produtos: administração substitui"
  on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and public.is_manager())
  with check (bucket_id = 'produtos' and public.is_manager());
create policy "produtos: administração apaga"
  on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and public.is_manager());

-- -----------------------------------------------------------------------------
-- B) Papel de cada foto. A principal continua sendo is_cover (uma por produto).
-- -----------------------------------------------------------------------------
alter table public.product_media
  add column kind text not null default 'galeria'
    check (kind in ('galeria', 'embalagem', 'composicao', 'apresentacao'));

alter table public.product_media
  add constraint product_media_path_format
    check (storage_path ~ '^[a-z0-9][a-z0-9/_.-]*\.(webp|jpe?g|png|avif)$');

create unique index product_media_unique_path_idx
  on public.product_media (product_id, storage_path);

-- -----------------------------------------------------------------------------
-- C) Funções do painel
-- -----------------------------------------------------------------------------

-- Liga um arquivo já enviado ao produto. Confere que o arquivo existe no bucket.
create or replace function public.admin_attach_media(
  p_product_id uuid,
  p_path       text,
  p_alt        text,
  p_kind       text default 'galeria',
  p_cover      boolean default false
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id   uuid;
  v_alt  text := nullif(trim(p_alt), '');
  v_sort integer;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar fotos.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produto não encontrado.' using errcode = 'no_data_found';
  end if;
  if not exists (
    select 1 from storage.objects o where o.bucket_id = 'produtos' and o.name = p_path
  ) then
    raise exception 'O arquivo da foto não foi encontrado. Envie de novo.' using errcode = 'no_data_found';
  end if;
  if v_alt is null then
    select p.name into v_alt from public.products p where p.id = p_product_id;
  end if;

  select coalesce(max(m.sort_order), 0) + 10 into v_sort
  from public.product_media m where m.product_id = p_product_id;

  -- Sem foto principal ainda: a primeira vira principal.
  if not p_cover and not exists (
    select 1 from public.product_media m where m.product_id = p_product_id and m.is_cover
  ) then
    p_cover := true;
  end if;

  if p_cover then
    update public.product_media set is_cover = false
     where product_id = p_product_id and is_cover;
  end if;

  insert into public.product_media (product_id, storage_path, alt_text, sort_order, is_cover, kind)
  values (p_product_id, p_path, v_alt, v_sort, p_cover, coalesce(nullif(p_kind, ''), 'galeria'))
  on conflict (product_id, storage_path) do update
    set alt_text = excluded.alt_text, kind = excluded.kind, is_cover = excluded.is_cover
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_set_media_cover(p_media_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare v_product uuid;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar fotos.' using errcode = 'insufficient_privilege';
  end if;
  select product_id into v_product from public.product_media where id = p_media_id;
  if v_product is null then
    raise exception 'Foto não encontrada.' using errcode = 'no_data_found';
  end if;
  update public.product_media set is_cover = false where product_id = v_product and is_cover;
  update public.product_media set is_cover = true where id = p_media_id;
end;
$$;

-- Tira a foto do produto e devolve o caminho do arquivo (o app apaga o arquivo
-- pela API do Storage se ninguém mais usar). Se era a principal, a próxima
-- foto do produto assume.
create or replace function public.admin_remove_media(p_media_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_product uuid;
  v_path    text;
  v_cover   boolean;
begin
  if not public.is_manager() then
    raise exception 'Apenas a administração pode alterar fotos.' using errcode = 'insufficient_privilege';
  end if;
  delete from public.product_media where id = p_media_id
  returning product_id, storage_path, is_cover into v_product, v_path, v_cover;
  if v_product is null then
    raise exception 'Foto não encontrada.' using errcode = 'no_data_found';
  end if;
  if v_cover then
    update public.product_media set is_cover = true
     where id = (
       select m.id from public.product_media m
       where m.product_id = v_product order by m.sort_order, m.created_at limit 1
     );
  end if;
  return v_path;
end;
$$;

revoke execute on function public.admin_attach_media(uuid, text, text, text, boolean) from public, anon;
revoke execute on function public.admin_set_media_cover(uuid) from public, anon;
revoke execute on function public.admin_remove_media(uuid) from public, anon;
grant execute on function public.admin_attach_media(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.admin_set_media_cover(uuid) to authenticated;
grant execute on function public.admin_remove_media(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- D) Fotos públicas da loja (todas as fotos dos produtos visíveis, em ordem).
-- Roda como dona, igual às outras views da loja: só sai foto de produto público.
-- -----------------------------------------------------------------------------
create view public.v_store_media as
select
  c.slug as product_slug,
  m.storage_path as path,
  m.alt_text as alt,
  m.kind,
  m.is_cover,
  m.sort_order
from public.product_media m
join public.v_store_catalog c on c.id = m.product_id;

revoke all on public.v_store_media from public, anon, authenticated;
grant select on public.v_store_media to anon, authenticated;

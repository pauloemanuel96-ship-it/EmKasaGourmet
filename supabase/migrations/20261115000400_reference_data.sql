-- =============================================================================
-- 0004 · Dados de referência (não são dados da empresa)
--
-- ALERGÊNICOS: lista de referência baseada na rotulagem obrigatória da ANVISA
-- (alimentos que causam alergias alimentares + glúten e lactose).
-- [PENDENTE] Confirmar a norma vigente e a lista com o responsável técnico
-- antes do lançamento (docs/PENDENCIAS.md). Ajustes entram em nova migration.
--
-- RÓTULOS ALIMENTARES: só aparecem na loja após aprovação por produto (RN-07).
-- =============================================================================

insert into public.allergens (code, name) values
  ('trigo',              'Trigo'),
  ('centeio',            'Centeio'),
  ('cevada',             'Cevada'),
  ('aveia',              'Aveia'),
  ('crustaceos',         'Crustáceos'),
  ('ovos',               'Ovos'),
  ('peixes',             'Peixes'),
  ('amendoim',           'Amendoim'),
  ('soja',               'Soja'),
  ('leite',              'Leite (de todos os mamíferos)'),
  ('amendoa',            'Amêndoa'),
  ('avela',              'Avelã'),
  ('castanha_de_caju',   'Castanha-de-caju'),
  ('castanha_do_para',   'Castanha-do-pará (castanha-do-brasil)'),
  ('macadamia',          'Macadâmia'),
  ('nozes',              'Nozes'),
  ('peca',               'Pecã'),
  ('pistache',           'Pistache'),
  ('pinoli',             'Pinoli'),
  ('castanhas',          'Castanhas'),
  ('latex_natural',      'Látex natural'),
  ('gluten',             'Glúten'),
  ('lactose',            'Lactose')
on conflict (code) do nothing;

insert into public.diet_labels (code, name, requires_evidence) values
  ('vegano',      'Vegano',      true),
  ('vegetariano', 'Vegetariano', true),
  ('sem_gluten',  'Sem glúten',  true),
  ('sem_lactose', 'Sem lactose', true),
  ('low_carb',    'Low carb',    true),
  ('fit',         'Fit',         true)
on conflict (code) do nothing;

-- Configurações iniciais SEM valores do negócio (preenchidos pelo painel depois).
insert into public.settings (key, value, is_public, description) values
  ('reservation_minutes', 'null'::jsonb, false, 'Minutos que um pedido não pago segura o estoque (RN-02). [PENDENTE]'),
  ('whatsapp_number',     'null'::jsonb, true,  'WhatsApp oficial de atendimento, formato E.164. [PENDENTE]')
on conflict (key) do nothing;

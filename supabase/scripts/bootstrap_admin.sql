-- HFC Hub — cria o PRIMEIRO admin da organização.
--
-- Rode UMA vez, no SQL Editor do painel do Supabase (ou via psql), depois de
-- aplicar as migrações. É o único cadastro feito à mão: daí em diante todo mundo
-- entra por convite, que você libera em Configurações → Convites.
--
-- ⚠️ Edite as três primeiras linhas antes de rodar. NÃO comite o arquivo com a
--    sua senha preenchida — troque de volta pelos placeholders depois.

do $$
declare
  v_email text := 'SEU_EMAIL@AQUI';         -- e-mail de login do admin
  v_senha text := 'SUA_SENHA_AQUI';         -- mínimo 8 caracteres (regra do app)
  v_nome  text := 'Seu Nome';
  v_org   uuid := '00000000-0000-4000-8000-000000000001';  -- org HFC (seed 0003)
  v_uid   uuid := gen_random_uuid();
begin
  if v_email = 'SEU_EMAIL@AQUI' then
    raise exception 'Edite v_email/v_senha/v_nome antes de rodar este script.';
  end if;

  -- O trigger handle_new_user() lê o convite para descobrir org e papel.
  -- Criando o convite antes, o admin nasce pelo mesmo caminho de todo mundo.
  insert into public.signup_invite (org_id, email, role)
  values (v_org, v_email, 'admin')
  on conflict (lower(email))
  do update set role = 'admin', usado_em = null, usado_por = null;

  -- Usuário do Supabase Auth, já com e-mail confirmado (não há inbox aqui).
  -- As colunas de token precisam ir como '' e não NULL: o GoTrue lê todas como
  -- string e quebra com "Database error querying schema" se encontrar NULL.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change, phone_change_token,
    reauthentication_token, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    v_email, crypt(v_senha, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', v_nome),
    '', '', '', '', '', '', '', '',
    now(), now()
  );

  -- Sem a identity de provider 'email', o login por senha não encontra o usuário.
  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    v_uid::text, v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  raise notice 'Admin criado: % (uid %). Entre em /login com essa senha.', v_email, v_uid;
end $$;

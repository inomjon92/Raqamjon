-- Raqamjon onlayn admin paneli (Supabase loyihasi "raqamjon").
-- Jadvallarga to'g'ridan-to'g'ri kirish yopiq (RLS, siyosat yo'q); ilova faqat quyidagi
-- SECURITY DEFINER funksiyalarini oila tokeni yoki parol bilan chaqiradi.
create extension if not exists pgcrypto with schema extensions;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  pass_hash text not null,
  token text unique not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  seen_at timestamptz not null default now()
);

create table public.kids (
  family_id uuid not null references public.families(id) on delete cascade,
  id text not null,
  name text not null,
  avatar text,
  grade int,
  summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (family_id, id)
);

create table public.owner (
  id int primary key default 1 check (id = 1),
  pass_hash text not null
);

alter table public.families enable row level security;
alter table public.kids enable row level security;
alter table public.owner enable row level security;

create or replace function public.family_create(p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_code text; v_token text;
begin
  if length(coalesce(p_password, '')) < 6 then raise exception 'Parol kamida 6 belgi bo''lishi kerak'; end if;
  loop
    v_code := 'RJ-' || upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when length(v_code) = 9 and not exists (select 1 from families where code = v_code);
  end loop;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into families(code, pass_hash, token) values (v_code, crypt(p_password, gen_salt('bf')), v_token);
  return jsonb_build_object('code', v_code, 'token', v_token);
end $$;

create or replace function public.family_login(p_code text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare f families;
begin
  select * into f from families where code = upper(trim(p_code));
  if f.id is null or f.pass_hash <> crypt(p_password, f.pass_hash) then
    perform pg_sleep(1);
    raise exception 'Kod yoki parol noto''g''ri';
  end if;
  return jsonb_build_object('code', f.code, 'token', f.token);
end $$;

create or replace function public.family_get(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare f families;
begin
  select * into f from families where token = p_token;
  if f.id is null then raise exception 'Kirish muddati tugagan'; end if;
  update families set seen_at = now() where id = f.id;
  return jsonb_build_object(
    'code', f.code,
    'config', f.config,
    'kids', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'name', k.name, 'avatar', k.avatar, 'grade', k.grade, 'summary', k.summary, 'updated_at', k.updated_at) order by k.name) from kids k where k.family_id = f.id), '[]'::jsonb)
  );
end $$;

create or replace function public.sync_push(p_token text, p_kids jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare f families; k jsonb;
begin
  select * into f from families where token = p_token;
  if f.id is null then raise exception 'Kirish muddati tugagan'; end if;
  if jsonb_array_length(p_kids) > 10 then raise exception 'Juda ko''p profil'; end if;
  for k in select * from jsonb_array_elements(p_kids) loop
    insert into kids(family_id, id, name, avatar, grade, summary, updated_at)
    values (f.id, left(k->>'id', 40), left(k->>'name', 60), left(k->>'avatar', 16), (k->>'grade')::int, coalesce(k->'summary', '{}'::jsonb), now())
    on conflict (family_id, id) do update set name = excluded.name, avatar = excluded.avatar, grade = excluded.grade, summary = excluded.summary, updated_at = now();
  end loop;
  update families set seen_at = now() where id = f.id;
  return family_get(p_token);
end $$;

create or replace function public.config_set(p_token text, p_config jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_config::text) > 200000 then raise exception 'Sozlamalar juda katta'; end if;
  update families set config = p_config where token = p_token;
  if not found then raise exception 'Kirish muddati tugagan'; end if;
end $$;

create or replace function public.kid_delete(p_token text, p_kid text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from kids k using families f where f.token = p_token and k.family_id = f.id and k.id = p_kid;
end $$;

-- Bosh admin: birinchi chaqiruvdagi parol saqlanadi (kamida 8 belgi).
create or replace function public.owner_overview(p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  select pass_hash into h from owner where id = 1;
  if h is null then
    if length(coalesce(p_password, '')) < 8 then raise exception 'Bosh admin paroli kamida 8 belgi'; end if;
    insert into owner(id, pass_hash) values (1, crypt(p_password, gen_salt('bf')));
  elsif h <> crypt(p_password, h) then
    perform pg_sleep(1);
    raise exception 'Parol noto''g''ri';
  end if;
  return jsonb_build_object(
    'families', (select count(*) from families),
    'kids', (select count(*) from kids),
    'active7', (select count(*) from kids where updated_at > now() - interval '7 days'),
    'list', coalesce((select jsonb_agg(jsonb_build_object('family', f.code, 'name', k.name, 'avatar', k.avatar, 'grade', k.grade, 'summary', k.summary, 'updated_at', k.updated_at) order by k.updated_at desc)
      from kids k join families f on f.id = k.family_id), '[]'::jsonb)
  );
end $$;

revoke all on function public.family_create(text), public.family_login(text, text), public.family_get(text), public.sync_push(text, jsonb), public.config_set(text, jsonb), public.kid_delete(text, text), public.owner_overview(text) from public;
grant execute on function public.family_create(text), public.family_login(text, text), public.family_get(text), public.sync_push(text, jsonb), public.config_set(text, jsonb), public.kid_delete(text, text), public.owner_overview(text) to anon, authenticated;

create table if not exists public.usuarios_proyecto (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  usuario    text not null unique,
  pass       text not null
);

alter table public.usuarios_proyecto enable row level security;

create policy "anon puede leer usuarios"
  on public.usuarios_proyecto for select to anon using (true);

grant usage on schema public to anon;
grant select on public.usuarios_proyecto to anon;

insert into public.usuarios_proyecto (usuario, pass)
values ('daniel', 'daniel');
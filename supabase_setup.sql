-- Ejecuta esto en Supabase > SQL Editor (proyecto NUEVO o vacío)

-- 1) Catálogo de pokémon
create table if not exists public.pokemons_proyecto (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  nombre         text not null unique,
  tipo           text,
  fuerza         int  not null,
  vida           int  not null,
  vida_actual    int  not null,
  img            text,
  gif1           text,
  gif2           text,
  "estadoPokemon" text default 'vivo'
);

insert into public.pokemons_proyecto
  (nombre, tipo, fuerza, vida, vida_actual, img, gif1, gif2, "estadoPokemon")
values
  ('charizard', 'Fuego/Volador', 84, 185, 185, './PNG/charizard.png', './GIF/jugador1/charizard.gif', './GIF/jugador2/charizard.gif', 'vivo'),
  ('blastoise', 'Agua', 83, 186, 186, './PNG/blastoise.png', './GIF/jugador1/blastoise.gif', './GIF/jugador2/blastoise.gif', 'vivo'),
  ('venusaur', 'Planta/Veneno', 82, 187, 187, './PNG/venusaur.png', './GIF/jugador1/venusaur.gif', './GIF/jugador2/venusaur.gif', 'vivo'),
  ('raichu', 'Eléctrico', 90, 167, 167, './PNG/raichu.png', './GIF/jugador1/raichu.gif', './GIF/jugador2/raichu.gif', 'vivo'),
  ('mewtwo', 'Psíquico', 110, 213, 213, './PNG/mewtwo.png', './GIF/jugador1/mewtwo.gif', './GIF/jugador2/mewtwo.gif', 'vivo'),
  ('gengar', 'Fantasma/Veneno', 65, 167, 167, './PNG/gengar.png', './GIF/jugador1/gengar.gif', './GIF/jugador2/gengar.gif', 'vivo'),
  ('dragonite', 'Dragón/Volador', 134, 198, 198, './PNG/dragonite.png', './GIF/jugador1/dragonite.gif', './GIF/jugador2/dragonite.gif', 'vivo'),
  ('snorlax', 'Normal', 110, 267, 267, './PNG/snorlax.png', './GIF/jugador1/snorlax.gif', './GIF/jugador2/snorlax.gif', 'vivo'),
  ('machamp', 'Lucha', 130, 197, 197, './PNG/machamp.png', './GIF/jugador1/machamp.gif', './GIF/jugador2/machamp.gif', 'vivo'),
  ('alakazam', 'Psíquico', 90, 162, 162, './PNG/alakazam.png', './GIF/jugador1/alakazam.gif', './GIF/jugador2/alakazam.gif', 'vivo'),
  ('vaporeon', 'Agua', 117, 237, 237, './PNG/vaporeon.png', './GIF/jugador1/vaporeon.gif', './GIF/jugador2/vaporeon.gif', 'vivo')
on conflict (nombre) do nothing;

-- 2) Tabla donde se guarda cada batalla
create table if not exists public.partidas (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  turno       int  not null default 1 check (turno in (1, 2)),
  estado      text not null default 'en_curso' check (estado in ('en_curso', 'terminada')),
  ganador     int  check (ganador in (1, 2)),
  activo1     text,
  activo2     text,
  pokemons    jsonb not null
);

-- 3) Seguridad (RLS)
alter table public.partidas enable row level security;
alter table public.pokemons_proyecto enable row level security;

create policy "anon puede leer el catalogo"
  on public.pokemons_proyecto for select to anon using (true);
create policy "anon puede crear partidas"
  on public.partidas for insert to anon with check (true);
create policy "anon puede leer partidas"
  on public.partidas for select to anon using (true);
create policy "anon puede actualizar partidas"
  on public.partidas for update to anon using (true) with check (true);
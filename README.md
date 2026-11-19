# Simulador de batalla Pokémon

Simulador web de batalla Pokémon por turnos para dos jugadores. Incluye pantalla de login y guarda los datos y el progreso de la partida en una base de datos **Supabase**, de modo que la batalla se puede reanudar al recargar la página.

## Demo

- https://batalla-pokemon-dsg.netlify.app

## Características

- Login con usuario y contraseña almacenados en Supabase.
- Cada partida reparte 6 pokémon aleatorios sin repetir: 3 para el jugador 1 y 3 para el jugador 2.
- Combate por turnos: **Luchar** (ataca con la fuerza del pokémon) o **Pokémon** (cambiar de pokémon).
- Barra de vida para cada pokémon y pokeballs que se desactivan cuando su pokémon es derrotado.
- Si un pokémon cae, su dueño debe cambiar de pokémon (ese cambio no consume turno).
- La partida termina cuando a un jugador no le quedan pokémon vivos.
- La partida se guarda en Supabase tras cada acción y se reanuda al recargar la página.

## Tecnologías

- HTML, CSS y JavaScript (sin frameworks)
- [Supabase](https://supabase.com) (PostgreSQL + API REST)
- [Netlify](https://www.netlify.com) para el despliegue
- Git y GitHub para el control de versiones

## Estructura del proyecto

```
.
├── login.html        # Pantalla de login (punto de entrada)
├── login.css
├── pokemon.html      # Pantalla de batalla
├── pokemon.js        # Lógica del juego y conexión con Supabase
├── style.css         # Estilos de la batalla
├── PNG/              # Imágenes: fondos, base y miniatura de cada pokémon
└── GIF/
    ├── jugador1/     # GIFs animados vistos de espaldas
    └── jugador2/     # GIFs animados vistos de frente
```

## Base de datos (Supabase)

Se usan tres tablas:

| Tabla | Para qué sirve |
|---|---|
| `pokemons_proyecto` | Catálogo de pokémon: nombre, tipo, fuerza, vida y rutas de imágenes. Solo lectura. |
| `partidas` | Una fila por batalla: pokémon de cada jugador, vida actual, turno, pokémon activos y estado. |
| `usuarios_proyecto` | Usuarios del login (`usuario` y `pass`). |

### Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, crea las tablas `pokemons_proyecto` y `partidas`, e inserta los pokémon del catálogo.
3. Crea la tabla de usuarios y un usuario de prueba:

   ```sql
   create table if not exists public.usuarios_proyecto (
     id         bigint generated always as identity primary key,
     created_at timestamptz not null default now(),
     usuario    text not null unique,
     pass       text not null
   );

   insert into public.usuarios_proyecto (usuario, pass)
   values ('ash', 'pikachu123');
   ```

4. Activa RLS y da permisos de lectura y escritura al rol `anon`:

   ```sql
   alter table public.pokemons_proyecto enable row level security;
   alter table public.partidas          enable row level security;
   alter table public.usuarios_proyecto enable row level security;

   create policy "anon lee catalogo"  on public.pokemons_proyecto for select to anon using (true);
   create policy "anon lee usuarios"  on public.usuarios_proyecto for select to anon using (true);
   create policy "anon crea partidas" on public.partidas for insert to anon with check (true);
   create policy "anon lee partidas"  on public.partidas for select to anon using (true);
   create policy "anon actualiza partidas"
     on public.partidas for update to anon using (true) with check (true);

   grant usage on schema public to anon;
   grant select on public.pokemons_proyecto to anon;
   grant select on public.usuarios_proyecto to anon;
   grant select, insert, update on public.partidas to anon;
   ```

5. En **Project Settings → Data API / API Keys** copia la *Project URL* y la clave **anon**, y ponlas al principio de `pokemon.js` y de `login.html`:

   ```js
   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co/rest/v1";
   const SUPABASE_KEY = "TU_CLAVE_ANON";
   ```

## Ejecutar en local

No necesita instalación. Abre `login.html` en el navegador, o usa la extensión **Live Server** de VS Code.

## Despliegue

El proyecto está pensado para publicarse como sitio estático en Netlify, conectado al repositorio de GitHub: cada `git push` actualiza la web automáticamente. Netlify distingue mayúsculas y minúsculas en los nombres de archivo, así que los nombres de las imágenes deben coincidir exactamente con los que usa el código.

## Cómo se juega

1. Entra con tu usuario y contraseña.
2. El jugador 1 empieza. En tu turno pulsa **Luchar** para atacar al pokémon rival, o **Pokémon** para cambiar a otro de tus pokémon.
3. Cuando un pokémon llega a 0 de vida queda desactivado y hay que sacar otro.
4. Gana el jugador que deja al rival sin pokémon vivos.

## Notas de seguridad

Este es un proyecto educativo:

- La clave `anon` de Supabase es pública por diseño. La protección real la dan las políticas RLS.
- **Nunca** pongas la clave `service_role` en el código del navegador.
- Las contraseñas de `usuarios_proyecto` se guardan en texto normal y la tabla es legible con la clave pública. Usa solo contraseñas de prueba. Para un uso real habría que usar Supabase Auth o guardar las contraseñas cifradas y comprobarlas desde el servidor.
- `pokemon.html` se puede abrir directamente sin pasar por el login.

## Posibles mejoras

- Autenticación segura con Supabase Auth.
- Asociar cada partida a un usuario.
- Tipos y ventajas entre pokémon, y varios ataques distintos.
- Historial de partidas y ranking.
- Botón de **Nueva partida** en la interfaz.

## Autor

Daniel — [@danielsg04](https://github.com/danielsg04)

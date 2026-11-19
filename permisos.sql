-- =====================================================================
-- PERMISOS PARA EL ROL "anon" (GRANT)
--
-- Supabase tiene dos capas de seguridad y hacen falta las dos:
--   1) GRANT -> dice QUÉ operaciones puede hacer un rol sobre una tabla.
--   2) RLS   -> dice QUÉ FILAS puede ver o modificar (las "policies").
-- Si falta el GRANT, la API devuelve el error 42501 "permission denied",
-- aunque la política RLS esté bien creada.
--
-- "anon" es el rol que usa la clave pública (anon key) de la web, es decir,
-- cualquier visitante que no ha iniciado sesión con Supabase Auth.
-- =====================================================================

-- Permite al rol anon "entrar" en el esquema public, donde están mis tablas.
-- Sin esto no puede acceder a ninguna tabla de ese esquema.
grant usage on schema public to anon;

-- Catálogo de pokémon: SOLO LECTURA.
-- La web necesita leer los pokémon para repartirlos, pero nadie
-- puede modificarlos ni borrarlos desde el navegador.
grant select on public.pokemons_proyecto to anon;

-- Partidas: leer, crear y actualizar.
--   select -> reanudar una partida guardada
--   insert -> crear una partida nueva al empezar
--   update -> guardar la vida, el turno, etc. tras cada acción
-- No se da "delete": nadie puede borrar partidas desde el navegador.
grant select, insert, update on public.partidas to anon;

-- Usuarios (login): SOLO LECTURA, para poder comprobar usuario y contraseña.
-- Aviso: con este método cualquiera con la clave pública puede leer la tabla,
-- por eso solo deben usarse contraseñas de prueba.
grant select on public.usuarios_proyecto to anon;
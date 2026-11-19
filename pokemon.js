<<<<<<< HEAD
// ===================== CONFIGURACIÓN SUPABASE =====================
const SUPABASE_URL = "https://xmgxilvmonfuiasgehts.supabase.co/rest/v1"; 
// La anon key es pública por diseño; la seguridad la dan las políticas RLS.
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ3hpbHZtb25mdWlhc2dlaHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwMzg0MzQsImV4cCI6MjExMDYxNDQzNH0.Kq18qkkjznardTr31TFsNDXuFMfM0LMyS6qVFNqqwPo";

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
};

// ===================== ESTADO DE LA PARTIDA =====================
let lista = []; // Los 6 pokémon de esta partida
let turnoActual = 1;
let partidaId = null;
let partidaTerminada = false;
let ganador = null;

// ===================== SUPABASE =====================
async function cargarCatalogo() {
  const res = await fetch(`${SUPABASE_URL}/pokemons_proyecto?select=*`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error("Catálogo: " + res.status + " " + (await res.text()));
  return res.json();
}

async function crearPartida(lista) {
  const res = await fetch(`${SUPABASE_URL}/partidas`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify({
      turno: 1,
      activo1: lista[0].nombre,
      activo2: lista[3].nombre,
      pokemons: lista,
    }),
  });
  if (!res.ok) throw new Error("No se pudo crear la partida");
  const [partida] = await res.json();
  return partida.id;
}

async function cargarPartida(id) {
  const res = await fetch(`${SUPABASE_URL}/partidas?id=eq.${id}&select=*`, {
    headers: HEADERS,
  });
  if (!res.ok) return null;
  const filas = await res.json();
  return filas[0] || null;
}

// Guarda el estado actual. Se llama tras cada ataque o cambio de pokémon.
async function guardarPartida() {
  if (!partidaId) return;
  const p1 = buscarDatosPokemon(lista, document.querySelector(".gif1").src);
  const p2 = buscarDatosPokemon(lista, document.querySelector(".gif2").src);
  try {
    const res = await fetch(`${SUPABASE_URL}/partidas?id=eq.${partidaId}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({
        turno: turnoActual,
        estado: partidaTerminada ? "terminada" : "en_curso",
        ganador: ganador,
        activo1: p1 ? p1.nombre : null,
        activo2: p2 ? p2.nombre : null,
        pokemons: lista,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) console.error("Error al guardar:", await res.text());
  } catch (err) {
    console.error("Error de red al guardar:", err);
  }
}

// ===================== PREPARAR LA PARTIDA =====================
// Elige 6 pokémon distintos del catálogo (copias, para no tocar el original)
function pokemon_aleatorio(catalogo) {
  const elegidos = [];
  while (elegidos.length < 6) {
    const candidato = catalogo[Math.floor(Math.random() * catalogo.length)];
    if (elegidos.some((p) => p.nombre === candidato.nombre)) continue;
    elegidos.push({
      ...candidato,
      jugador: elegidos.length < 3 ? 1 : 2, // 3 primeros J1, 3 últimos J2
      vida_actual: candidato.vida, // todos empiezan con la vida completa
      vivo: true,
    });
  }
  return elegidos;
}

// Dibuja las 6 pokeballs y marca las de los pokémon muertos
function pintarPokeballs(lista) {
  const cajas = document.querySelectorAll(".pokeball-img1, .pokeball-img2");
  cajas.forEach((caja, i) => {
    caja.innerHTML = "<img src='./PNG/" + lista[i].nombre + ".png'>";
  });
  lista.filter((p) => !p.vivo).forEach(deshabilitarPokeball);
}

// Pone en el campo de batalla a un pokémon (gif, nombre y barra de vida)
function mostrarPokemonActivo(pokemon, jugador) {
  document.querySelector(".gif" + jugador).src =
    jugador === 1 ? pokemon.gif1 : pokemon.gif2;
  cambiarNombrePokemon(pokemon.nombre, jugador);
  const meter = document.querySelector(
    ".parte-jugador" + jugador + " .parte-inferior .vida"
  );
  meter.setAttribute("max", pokemon.vida);
  meter.setAttribute("value", pokemon.vida_actual);
}

// ===================== CAMBIAR DE POKÉMON =====================
function asignarPokemon(lista) {
  [1, 2].forEach((jugador) => {
    document.querySelectorAll(".pokeball-img" + jugador).forEach((caja) =>
      caja.addEventListener("click", (e) => {
        if (partidaTerminada) return;
        if (turnoActual !== jugador) {
          alert("¡No es tu turno! Turno del jugador " + turnoActual);
          return;
        }
        const pokemonActual = buscarDatosPokemon(
          lista,
          document.querySelector(".gif" + jugador).src
        );
        const pokemon = buscarDatosPokemon(lista, e.target.src);
        if (!pokemon) return;

        mostrarPokemonActivo(pokemon, jugador);
        ocultarPokeballs();

        // Si el anterior estaba muerto, el cambio es "gratis" (no pasa turno)
        if (!(pokemonActual && pokemonActual.vida_actual <= 0)) {
          turnoActual = jugador === 1 ? 2 : 1;
        }
        guardarPartida();
      })
    );
  });
}

// ===================== ATAQUE =====================
function atacarPokemon(lista) {
  if (partidaTerminada) return;
  const pokemon1 = buscarDatosPokemon(
    lista,
    document.querySelector(".parte-jugador1 .gif1").src
  );
  const pokemon2 = buscarDatosPokemon(
    lista,
    document.querySelector(".parte-jugador2 .gif2").src
  );
  if (!pokemon1 || !pokemon2) return;

  let ataqueExitoso = false;
  if (turnoActual == 1) {
    ataqueExitoso = aplicarAtaque(
      pokemon1,
      pokemon2,
      ".parte-jugador2 .parte-inferior .vida",
      lista
    );
    if (ataqueExitoso) turnoActual = 2;
  } else {
    ataqueExitoso = aplicarAtaque(
      pokemon2,
      pokemon1,
      ".parte-jugador1 .parte-inferior .vida",
      lista
    );
    if (ataqueExitoso) turnoActual = 1;
  }

  if (ataqueExitoso) {
    // Primero guardo en Supabase y luego aviso (alert bloquea la página)
    guardarPartida().then(() => {
      if (ganador) alert("¡Ha ganado el jugador " + ganador + "!");
    });
=======
// Lista vacía de pokemon
const pokemons = [];
let turnoActual = 1;
// Variable para controlar listeners
let listenersPokeballsAsignados = false;

// Crea una lista de pokemons y añade al HTML 6 imagenes con su pokemon correspondiente.
function pokemon_aleatorio(pokemons) {
  let lista = [];
  let lista_nombres = [];
  // Añade 6 pokemons a la lista sin repetir.
  while (lista.length != 6) {
    const numero = Math.floor(Math.random() * pokemons.length);
    // Para no repetir, lo comparo con una lista donde añado el nombre del pokemon
    if (lista_nombres.includes(pokemons[numero].nombre)) continue;
    // Si no está en la lista, añado el array a la lista principal y el nombre a lista_nombres
    else {
      let pokemon = pokemons[numero];
      // Añade propiedad jugador y vivo
      if (lista.length < 3) {
        pokemon.jugador = 1; // Jugador 1 recibe los 3 primeros
      } else {
        pokemon.jugador = 2; // Jugador 2 recibe los 3 últimos
      }
      pokemon.vivo = true;
      lista.push(pokemon);
      lista_nombres.push(pokemon.nombre);
    }
  }

  // Añado img de cada pokemon en un bucle
  const img = document.querySelectorAll(".pokeball-img1, .pokeball-img2");

  img.forEach((e, i) => {
    e.innerHTML = "<img src='./PNG/" + lista[i].nombre + ".png'>";
  });
  return lista;
}

// Cambiar de pokemon al pulsar un pokemon
function asignarPokemon(lista) {
  // Control de listeners
  if (listenersPokeballsAsignados) return;
  listenersPokeballsAsignados = true;

  const div1 = document.querySelectorAll(".pokeball-img1");
  div1.forEach((e) =>
    e.addEventListener("click", (e) => {
      if (turnoActual !== 1) {
        alert("¡No es tu turno! Turno del jugador " + turnoActual);
        return;
      } else {
        const gif1Actual = document.querySelector(".gif1");
        const pokemonActual = buscarDatosPokemon(lista, gif1Actual.src);

        const elemento = e.target.src;
        const pokemon = buscarDatosPokemon(lista, elemento);
        if (pokemon) {
          const img = document.querySelector(".gif1");
          img.src = pokemon.gif1;
          cambiarNombrePokemon(pokemon.nombre, 1);
          const meter1 = document.querySelector(
            ".parte-jugador1 .parte-inferior .vida"
          );
          meter1.setAttribute("max", pokemon.vida);
          meter1.setAttribute("value", pokemon.vida_actual);
          ocultarPokeballs();
          if (pokemonActual && pokemonActual.vida_actual <= 0) {
          } else {
            turnoActual = 2;
          }
        }
      }
    })
  );

  const div2 = document.querySelectorAll(".pokeball-img2");
  div2.forEach((e) =>
    e.addEventListener("click", (e) => {
      if (turnoActual !== 2) {
        alert("¡No es tu turno! Turno del jugador " + turnoActual);
        return;
      } else {
        const gif2Actual = document.querySelector(".gif2");
        const pokemonActual = buscarDatosPokemon(lista, gif2Actual.src);

        const elemento = e.target.src;
        // Me devuelve el arr del pokemon con sus datos
        const pokemon = buscarDatosPokemon(lista, elemento);
        if (pokemon) {
          const img = document.querySelector(".gif2");
          img.src = pokemon.gif2;
          cambiarNombrePokemon(pokemon.nombre, 2);
          // -----------------------------
          console.log(img.src);
          const meter2 = document.querySelector(
            ".parte-jugador2 .parte-inferior .vida"
          );
          // Introduce valores a la etiqueta 'meter' en HTML
          meter2.setAttribute("max", pokemon.vida);
          console.log("Vida inicial: " + pokemon.vida);
          meter2.setAttribute("value", pokemon.vida_actual);
          console.log("Vida actual: " + pokemon.vida_actual);
          ocultarPokeballs();
          if (pokemonActual && pokemonActual.vida_actual <= 0) {
          } else {
            turnoActual = 1;
          }
        }
      }
    })
  );
}

function atacarPokemon(lista) {
  // Al hacer click en el botón llama a esta función
  // Coge la etiqueta de cada pokemon
  const gif1 = document.querySelector(".parte-jugador1 .gif1");
  const gif2 = document.querySelector(".parte-jugador2 .gif2");
  // Coge el valor de src
  const pokemon_src1 = gif1.src;
  const pokemon_src2 = gif2.src;
  // Busca el pokemon en la lista
  const pokemon1 = buscarDatosPokemon(lista, pokemon_src1);
  const pokemon2 = buscarDatosPokemon(lista, pokemon_src2);
  // Si encuentra a los dos pokemons entra al if
  if (pokemon1 && pokemon2) {
    let ataqueExitoso = false;
    if (turnoActual == 1) {
      // Ataca jugador1 a jugador2
      ataqueExitoso = aplicarAtaque(
        pokemon1,
        pokemon2,
        ".parte-jugador2 .parte-inferior .vida",
        lista
      );
      if (ataqueExitoso) turnoActual = 2;
    } else {
      // Ataca jugador2 a jugador1
      ataqueExitoso = aplicarAtaque(
        pokemon2,
        pokemon1,
        ".parte-jugador1 .parte-inferior .vida",
        lista
      );
      if (ataqueExitoso) turnoActual = 1;
    }
    console.log("Turno actual: " + turnoActual);
>>>>>>> 20b5efed0f207973831a7c04fbcca004617d11c1
  }
}

function aplicarAtaque(atacante, defensor, selectorMeter, lista) {
<<<<<<< HEAD
  if (!comprobarVidaPokemon(atacante)) return false;

  const meter = document.querySelector(selectorMeter);
  meter.setAttribute("max", defensor.vida);

  defensor.vida_actual = Math.max(
    0,
    defensor.vida_actual - parseFloat(atacante.fuerza)
  );
  meter.setAttribute("value", defensor.vida_actual);

  if (defensor.vida_actual <= 0) {
    defensor.vivo = false;
    defensor.estadoPokemon = "muerto";
    deshabilitarPokeball(defensor);
    comprobarVictoria(lista);
  }
=======
  // Comprobación para que el pokemon no ataque al estar muerto
  if (!comprobarVidaPokemon(atacante)) {
    return false;
  }
  const meter = document.querySelector(selectorMeter);

  meter.setAttribute("value", defensor.vida_actual);
  meter.setAttribute("max", defensor.vida);

  // Coge el nº de HP que tiene <meter>
  let barra_vida = parseFloat(meter.getAttribute("value"));
  // console.log("HP:" + barra_vida);

  const fuerza = parseFloat(atacante.fuerza);
  // console.log("Fuerza: " + fuerza);

  let n_barra_vida = Math.max(0, barra_vida - fuerza);
  meter.setAttribute("value", n_barra_vida);
  // console.log("Vida restante: " + n_barra_vida);

  defensor.vida_actual = n_barra_vida;

  if (defensor.vida_actual <= 0) {
    defensor.vivo = false;
    // Deshabilitar su pokeball visualmente
    deshabilitarPokeball(defensor);
    comprobarVictoria(lista);
  }
  // Compruebo que la vida ha sido modificada en el array
  // console.log(lista);
>>>>>>> 20b5efed0f207973831a7c04fbcca004617d11c1
  return true;
}

function deshabilitarPokeball(pokemon) {
<<<<<<< HEAD
  document
    .querySelectorAll(".pokeball-img1, .pokeball-img2")
    .forEach((e) => {
      const img = e.querySelector("img");
      if (img && img.src.includes(pokemon.nombre)) {
        e.style.opacity = "0.4";
        e.style.filter = "grayscale(100%)";
        e.style.pointerEvents = "none";
        e.classList.add("pokemon-muerto");
      }
    });
}

function comprobarVidaPokemon(pokemon) {
  if (pokemon.vida_actual <= 0) {
=======
  // Buscar la pokeball que contiene esta imagen
  const pokeballs = document.querySelectorAll(".pokeball-img1, .pokeball-img2");
  pokeballs.forEach((e) => {
    const img = e.querySelector("img");
    // console.log(img, img.src); Contiene el nombre del pokemon
    if (img && img.src.includes(pokemon.nombre)) {
      // Deshabilitar visualmente
      e.style.opacity = "0.4";
      e.style.filter = "grayscale(100%)";
      e.style.pointerEvents = "none"; // No responde a clicks
      e.classList.add("pokemon-muerto");
    }
  });
}

function comprobarVidaPokemon(pokemon) {
  if (pokemon.vida_actual == 0) {
>>>>>>> 20b5efed0f207973831a7c04fbcca004617d11c1
    alert("¡Tu pokemon " + pokemon.nombre + " está muerto, cambia de pokemon!");
    pokemon.estadoPokemon = "muerto";
    return false;
  }
  return true;
}

function cambiarNombrePokemon(nombre, jugador) {
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
<<<<<<< HEAD
  document.querySelector(
    ".parte-jugador" + jugador + " .nombre-pokemon"
  ).innerHTML = nombre;
  if (jugador === 1) {
    document.querySelector(".menu .menu-texto").innerHTML =
      "¿Qué debería hacer " + nombre + "?";
  }
}

// Marca la partida como terminada si a un jugador no le quedan pokémon vivos.
// El aviso se muestra después de guardar (ver atacarPokemon).
function comprobarVictoria(lista) {
  const vivos1 = lista.filter((e) => e.jugador === 1 && e.vivo).length;
  const vivos2 = lista.filter((e) => e.jugador === 2 && e.vivo).length;
  if (vivos1 === 0 || vivos2 === 0) {
    partidaTerminada = true;
    ganador = vivos1 === 0 ? 2 : 1;
    localStorage.removeItem("partida_id"); // la próxima carga crea una partida nueva
  }
}

function buscarDatosPokemon(lista, pokemon) {
  return lista.find((e) => pokemon.includes(e.nombre));
}

function ocultarPokeballs() {
  document.querySelectorAll(".pokeball-img1, .pokeball-img2").forEach((p) => {
    if (!p.classList.contains("pokemon-muerto")) {
      p.style.opacity = "0.5";
      p.style.pointerEvents = "none";
=======
  if (jugador === 1) {
    let div = document.querySelector(".parte-jugador1 .nombre-pokemon");
    div.innerHTML = nombre;
    let menu_texto = document.querySelector(".menu .menu-texto");
    menu_texto.innerHTML = "¿Qué debería hacer " + nombre + "?";
  } else {
    let div = document.querySelector(".parte-jugador2 .nombre-pokemon");
    div.innerHTML = nombre;
  }
}
// Comprueba si un jugador ha ganado o perdido
function comprobarVictoria(lista) {
  const vivosJugador1 = lista.filter((e) => e.jugador === 1 && e.vivo).length;
  const vivosJugador2 = lista.filter((e) => e.jugador === 2 && e.vivo).length;

  if (vivosJugador1 === 0) {
    alert("¡Has perdido!");
  }
  if (vivosJugador2 === 0) {
    alert("¡Has ganado!");
  }
}

// Busca el pokemon dentro de la lista
function buscarDatosPokemon(lista, pokemon) {
  return lista.find((e) => pokemon.includes(e.nombre));
}
function ocultarPokeballs() {
  const pokeballs = document.querySelectorAll(".pokeball-img1, .pokeball-img2");
  pokeballs.forEach((pokeball) => {
    if (!pokeball.classList.contains("pokemon-muerto")) {
      pokeball.style.opacity = "0.5";
      pokeball.style.pointerEvents = "none"; // NO CLICABLE
>>>>>>> 20b5efed0f207973831a7c04fbcca004617d11c1
    }
  });
}

<<<<<<< HEAD
// ===================== MENÚ =====================
function opcionMenu(lista) {
  document
    .querySelector(".menu .opcion1")
    .addEventListener("click", () => atacarPokemon(lista));

  document.querySelector(".menu .opcion2").addEventListener("click", () => {
    if (partidaTerminada) return;
    document.querySelectorAll(".pokeball-img1, .pokeball-img2").forEach((p) => {
      if (!p.classList.contains("pokemon-muerto")) {
        p.style.opacity = "1";
        p.style.filter = "none";
        p.style.pointerEvents = "auto";
      }
    });
  });

  // Botón opcional "Nueva partida" (class="nueva-partida" en el HTML)
  const botonNueva = document.querySelector(".menu .nueva-partida");
  if (botonNueva) {
    botonNueva.addEventListener("click", () => {
      localStorage.removeItem("partida_id");
      location.reload();
    });
  }
}

// ===================== ARRANQUE =====================
async function iniciar() {
  try {
    let activo1, activo2;

    // ¿Hay una partida en curso guardada en este navegador?
    const idGuardado = localStorage.getItem("partida_id");
    const partida = idGuardado ? await cargarPartida(idGuardado) : null;

    if (partida && partida.estado === "en_curso") {
      // Reanudar
      partidaId = partida.id;
      lista = partida.pokemons;
      turnoActual = partida.turno;
      activo1 = lista.find((p) => p.nombre === partida.activo1) || lista[0];
      activo2 = lista.find((p) => p.nombre === partida.activo2) || lista[3];
    } else {
      // Partida nueva
      const catalogo = await cargarCatalogo();
      lista = pokemon_aleatorio(catalogo);
      partidaId = await crearPartida(lista);
      localStorage.setItem("partida_id", partidaId);
      activo1 = lista[0];
      activo2 = lista[3];
    }

    pintarPokeballs(lista);
    asignarPokemon(lista);
    opcionMenu(lista);
    ocultarPokeballs();
    mostrarPokemonActivo(activo1, 1);
    mostrarPokemonActivo(activo2, 2);
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con Supabase. Revisa la consola.");
  }
}

iniciar();
=======
// Llama a una función depende de la acción que pulses
function opcionMenu(lista) {
  const botonAtaque = document.querySelector(".menu .opcion1");
  botonAtaque.addEventListener("click", () => atacarPokemon(lista));

  const botonPokemon = document.querySelector(".menu .opcion2");
  botonPokemon.addEventListener("click", () => {
    const pokeballs = document.querySelectorAll(
      ".pokeball-img1, .pokeball-img2"
    );
    pokeballs.forEach((pokeball) => {
      if (!pokeball.classList.contains("pokemon-muerto")) {
        pokeball.style.opacity = "1";
        pokeball.style.filter = "none";
        pokeball.style.pointerEvents = "auto";
      }
    });
  });
}

const options = {
  method: "GET",
  headers: {
    apikey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6emFmbmhneWJ4YXdmbGlqdXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzY1MjIsImV4cCI6MjA3NzgxMjUyMn0.zyjXtJw0nbg4iWNk8Cmn4ZygPJUNC2oORJUv2S8Qz3E",
    "User-Agent": "insomnia/11.6.2",
  },
};

fetch(
  "https://hzzafnhgybxawflijuzx.supabase.co/rest/v1/pokemons_proyecto?select=*",
  options
)
  .then((response) => response.json())
  .then((datos) => {
    datos.forEach((e) => pokemons.push(e));
    const lista = pokemon_aleatorio(pokemons);
    // console.log(lista);
    asignarPokemon(lista);
    opcionMenu(lista);
    ocultarPokeballs();

    // Pokémon iniciales
    document.querySelector(".gif1").src = lista[0].gif1;
    document.querySelector(".gif2").src = lista[3].gif2;
    cambiarNombrePokemon(lista[0].nombre, 1);
    cambiarNombrePokemon(lista[3].nombre, 2);
  })
  .catch((err) => console.error(err));
>>>>>>> 20b5efed0f207973831a7c04fbcca004617d11c1

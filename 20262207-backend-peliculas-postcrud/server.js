//=====================================================
// 1. IMPORTACIONES
//=====================================================

// Express permite crear el servidor y las rutas de la API.
const express = require("express");

// CORS permite que el HTML se comunique con este backend,
// aunque ambos se abran desde ubicaciones diferentes.
const cors = require("cors");

// Path facilita el trabajo con rutas de carpetas y archivos.
const path = require("path");

// Dotenv carga las variables privadas guardadas en el archivo .env.
// Allí se encuentra TMDB_API_KEY.
require("dotenv").config();


//=====================================================
// 2. CREACIÓN DEL SERVIDOR EXPRESS
//=====================================================

const app = express();

// Permite servir archivos colocados dentro de una carpeta public.
// Esta línea se conserva aunque actualmente el HTML esté fuera de ella.
app.use(express.static(path.join(__dirname, "public")));


//=====================================================
// 3. MIDDLEWARES
//=====================================================

// CORS debe declararse antes de las rutas.
// Autoriza la comunicación entre el HTML y el backend.
app.use(cors());

// Convierte el JSON enviado por el HTML en un objeto JavaScript.
// Gracias a esto podemos acceder a req.body.
app.use(express.json());


//=====================================================
// 4. CONFIGURACIÓN DE FETCH
//=====================================================

// node-fetch permite que Node.js consulte servicios externos,
// como la API de TMDB.
const fetch = (...args) =>
    import("node-fetch").then(
        ({ default: fetch }) => fetch(...args)
    );


//=====================================================
// 5. FUNCIÓN PARA NORMALIZAR TEXTOS
//=====================================================

// Esta función prepara los textos para compararlos.
//
// Ejemplos:
//
// "Matrix"
// "MATRIX"
// " matrix "
//
// Todos se convierten temporalmente en:
//
// "matrix"
//
// La normalización no cambia el título que verá el usuario.
// Solo crea una versión interna para realizar comparaciones.
function normalizarTexto(texto) {
    return String(texto)

        // Elimina espacios al inicio y al final.
        .trim()

        // Convierte las letras en minúsculas.
        .toLowerCase()

        // Separa las letras de sus tildes.
        .normalize("NFD")

        // Elimina las tildes.
        .replace(/[\u0300-\u036f]/g, "")

        // Convierte varios espacios seguidos en un solo espacio.
        .replace(/\s+/g, " ");
}


//=====================================================
// 6. OBTENER LOS DIRECTORES DESDE TMDB
//=====================================================

// La búsqueda general de TMDB devuelve título, fecha y portada,
// pero no devuelve directamente el director.
//
// Por eso debemos realizar una segunda consulta utilizando
// el identificador oficial de la película: tmdbId.
async function obtenerDirectoresEnTMDb(tmdbId) {

    const apiKey = process.env.TMDB_API_KEY;

    const url =
        `https://api.themoviedb.org/3/movie/${tmdbId}/credits` +
        `?api_key=${apiKey}`;

    const respuesta = await fetch(url);

    // Si TMDB no responde correctamente, generamos un error.
    if (!respuesta.ok) {
        throw new Error(
            `No se pudieron consultar los créditos. Estado ${respuesta.status}`
        );
    }

    const datos = await respuesta.json();

    // datos.crew contiene el equipo técnico de la película.
    //
    // filter() conserva solamente las personas cuyo trabajo
    // aparece como "Director".
    //
    // map() extrae el nombre de cada director.
    const directores = (datos.crew || [])
        .filter((persona) => persona.job === "Director")
        .map((persona) => persona.name);

    return directores;
}


//=====================================================
// 7. BUSCAR Y VALIDAR UNA PELÍCULA EN TMDB
//=====================================================

// Esta función:
//
// 1. Recibe el título escrito por el usuario.
// 2. Busca en TMDB en español.
// 3. Si no coincide, busca en inglés.
// 4. Exige una coincidencia exacta.
// 5. Obtiene los directores oficiales.
// 6. Devuelve los datos oficiales.
//
// Si no encuentra una coincidencia exacta, devuelve null.
async function buscarPeliculaEnTMDb(tituloBuscado) {

    const apiKey = process.env.TMDB_API_KEY;

    // Sin la clave privada no podemos consultar TMDB.
    if (!apiKey) {
        throw new Error(
            "TMDB_API_KEY no está configurada en el archivo .env"
        );
    }

    // Normalizamos el título únicamente para compararlo.
    const tituloNormalizado =
        normalizarTexto(tituloBuscado);

    // Primero consultaremos TMDB en español
    // y después en inglés.
    const idiomas = ["es-ES", "en-US"];

    // for...of recorre los idiomas uno por uno.
    for (const idioma of idiomas) {

        const url =
            "https://api.themoviedb.org/3/search/movie" +
            `?api_key=${apiKey}` +
            `&query=${encodeURIComponent(tituloBuscado)}` +
            `&language=${idioma}`;

        console.log(
            `[TMDB] Buscando "${tituloBuscado}" en ${idioma}`
        );

        const respuesta = await fetch(url);

        // Si TMDB devuelve un error técnico,
        // detenemos la validación.
        if (!respuesta.ok) {
            throw new Error(
                `TMDB respondió con el estado ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();

        console.log(
            `[TMDB] Resultados encontrados: ${
                datos.results ? datos.results.length : 0
            }`
        );

        // Si no encontramos resultados en este idioma,
        // continuamos con el siguiente.
        if (!datos.results || datos.results.length === 0) {
            continue;
        }

        // find() busca el primer resultado que coincida exactamente.
        const coincidencia = datos.results.find(
            (pelicula) => {

                // title contiene el título traducido al idioma solicitado.
                const tituloTraducido =
                    normalizarTexto(pelicula.title || "");

                // original_title contiene el título original.
                const tituloOriginal =
                    normalizarTexto(
                        pelicula.original_title || ""
                    );

                return (
                    tituloTraducido === tituloNormalizado ||
                    tituloOriginal === tituloNormalizado
                );
            }
        );

        // Si encontramos una coincidencia exacta,
        // completamos sus datos.
        if (coincidencia) {

            // Consultamos los directores mediante el tmdbId.
            const directores =
                await obtenerDirectoresEnTMDb(
                    coincidencia.id
                );

            // Si existe poster_path, formamos la URL de la imagen.
            // Si no existe, guardamos null.
            const portada = coincidencia.poster_path
                ? `https://image.tmdb.org/t/p/w500${coincidencia.poster_path}`
                : null;

            return {
                // Identificador único oficial de TMDB.
                tmdbId: coincidencia.id,

                // Título devuelto en el idioma consultado.
                tituloOficial: coincidencia.title,

                // Título original de la película.
                tituloOriginal: coincidencia.original_title,

                // Fecha oficial de estreno.
                fechaEstreno:
                    coincidencia.release_date || null,

                // Dirección de la imagen o null.
                portada: portada,

                // Arreglo con uno o varios directores.
                directores: directores
            };
        }
    }

    // Llegamos aquí si no hubo una coincidencia exacta.
    return null;
}


//=====================================================
// 8. BASE DE DATOS TEMPORAL
//=====================================================

// El arreglo peliculas simula una base de datos.
//
// Los datos agregados desaparecerán cuando se cierre
// o reinicie el servidor, porque todavía no utilizamos
// una base de datos permanente.
let peliculas = [
    {
        id: 1,
        titulo: "Matrix",
        director: "Lana Wachowski",
        tmdbId: null,
        fechaEstreno: null,
        portada: null
    },
    {
        id: 2,
        titulo: "Interstellar",
        director: "Christopher Nolan",
        tmdbId: null,
        fechaEstreno: null,
        portada: null
    }
];


//=====================================================
// 9. COMPLETAR LOS DATOS Y PORTADAS INICIALES
//=====================================================

// Esta función recupera las portadas de Matrix e Interstellar.
//
// También incorpora su tmdbId y fecha de estreno.
// Esta era la parte que faltaba en la versión anterior.
async function completarDatosIniciales() {

    for (const pelicula of peliculas) {

        try {
            const datosTMDb =
                await buscarPeliculaEnTMDb(
                    pelicula.titulo
                );

            if (datosTMDb) {
                pelicula.tmdbId =
                    datosTMDb.tmdbId;

                pelicula.fechaEstreno =
                    datosTMDb.fechaEstreno;

                pelicula.portada =
                    datosTMDb.portada;

                pelicula.tituloOriginal =
                    datosTMDb.tituloOriginal;

                console.log(
                    `[TMDB] Datos iniciales cargados para "${pelicula.titulo}"`
                );
            }

        } catch (error) {
            // Si falla una portada, no detenemos todo el servidor.
            // La película se mostrará con el espacio de imagen vacío.
            console.error(
                `[TMDB] No se pudieron completar los datos de "${pelicula.titulo}":`,
                error.message
            );
        }
    }

    console.log(
        "🎨 Películas y portadas iniciales preparadas"
    );
}


//=====================================================
// 10. CALCULAR EL SIGUIENTE ID INTERNO
//=====================================================

// No usamos peliculas.length + 1 porque podría repetirse
// un ID después de eliminar una película.
function obtenerSiguienteId() {

    if (peliculas.length === 0) {
        return 1;
    }

    // map() crea un arreglo que contiene solamente los IDs.
    const ids = peliculas.map(
        (pelicula) => pelicula.id
    );

    // Math.max() encuentra el ID mayor.
    // Después le sumamos uno.
    return Math.max(...ids) + 1;
}


//=====================================================
// 11. GET: LEER TODAS LAS PELÍCULAS
//=====================================================

app.get("/api/peliculas", (req, res) => {

    // res.json() convierte el arreglo en JSON
    // y lo envía al HTML.
    return res.json(peliculas);
});


//=====================================================
// 12. POST: AGREGAR UNA PELÍCULA
//=====================================================

app.post("/api/peliculas", async (req, res) => {

    try {
        // Desestructuramos los datos recibidos desde el HTML.
        const { titulo, director } = req.body;


        //-------------------------------------------------
        // VALIDACIÓN 1: CAMPOS OBLIGATORIOS
        //-------------------------------------------------

        if (
            typeof titulo !== "string" ||
            typeof director !== "string" ||
            !titulo.trim() ||
            !director.trim()
        ) {
            return res.status(400).json({
                error:
                    "El título y el director son obligatorios"
            });
        }


        //-------------------------------------------------
        // VALIDACIÓN 2: EXISTENCIA DE LA PELÍCULA
        //-------------------------------------------------

        // Consultamos TMDB antes de guardar.
        const peliculaTMDb =
            await buscarPeliculaEnTMDb(titulo);

        // null significa que no encontramos
        // una coincidencia exacta.
        if (!peliculaTMDb) {
            return res.status(404).json({
                error:
                    `No se encontró la película "${titulo.trim()}" ` +
                    "ni en español ni en inglés"
            });
        }


        //-------------------------------------------------
        // VALIDACIÓN 3: DIRECTORES DISPONIBLES
        //-------------------------------------------------

        if (
            !peliculaTMDb.directores ||
            peliculaTMDb.directores.length === 0
        ) {
            return res.status(422).json({
                error:
                    "TMDB encontró la película, pero no dispone " +
                    "de información sobre su director"
            });
        }


        //-------------------------------------------------
        // VALIDACIÓN 4: COMPROBAR EL DIRECTOR
        //-------------------------------------------------

        // Normalizamos el director ingresado
        // para compararlo con los directores oficiales.
        const directorNormalizado =
            normalizarTexto(director);

        // some() devuelve true si al menos un director
        // coincide con el nombre escrito por el usuario.
        const directorCoincide =
            peliculaTMDb.directores.some(
                (directorOficial) =>
                    normalizarTexto(
                        directorOficial
                    ) === directorNormalizado
            );

        if (!directorCoincide) {
            return res.status(422).json({
                error:
                    `El director "${director.trim()}" no corresponde ` +
                    `a la película "${peliculaTMDb.tituloOficial}"`,

                // También enviamos los nombres correctos.
                directoresCorrectos:
                    peliculaTMDb.directores
            });
        }


        //-------------------------------------------------
        // VALIDACIÓN 5: COMPROBAR DUPLICADOS
        //-------------------------------------------------

        // El tmdbId es único e independiente del idioma.
        //
        // Una película tendrá el mismo tmdbId aunque se busque
        // con su título español o inglés.
        const peliculaDuplicada =
            peliculas.some(
                (pelicula) =>
                    pelicula.tmdbId ===
                    peliculaTMDb.tmdbId
            );

        if (peliculaDuplicada) {
            return res.status(409).json({
                error:
                    `La película "${peliculaTMDb.tituloOficial}" ` +
                    "ya está registrada en el catálogo"
            });
        }


        //-------------------------------------------------
        // CREAR LA NUEVA PELÍCULA
        //-------------------------------------------------

        // Esta parte solo se ejecutará cuando todas
        // las validaciones hayan sido superadas.
        const nuevaPelicula = {
            id: obtenerSiguienteId(),

            tmdbId:
                peliculaTMDb.tmdbId,

            titulo:
                peliculaTMDb.tituloOficial,

            // Guardamos los nombres oficiales.
            // join(", ") une varios directores en un texto.
            director:
                peliculaTMDb.directores.join(", "),

            fechaEstreno:
                peliculaTMDb.fechaEstreno,

            portada:
                peliculaTMDb.portada
        };

        // Agregamos la película al arreglo.
        peliculas.push(nuevaPelicula);

        // 201 significa que el recurso fue creado.
        return res.status(201).json(
            nuevaPelicula
        );

    } catch (error) {

        console.error(
            "[POST /api/peliculas]",
            error.message
        );

        // 502 indica un problema al comunicarnos
        // con un servicio externo, en este caso TMDB.
        return res.status(502).json({
            error:
                "No fue posible verificar la película en TMDB"
        });
    }
});


//=====================================================
// 13. PUT: ACTUALIZAR UNA PELÍCULA
//=====================================================

// La edición aplica las mismas validaciones.
// Así evitamos introducir información incorrecta
// utilizando el botón Editar.
app.put("/api/peliculas/:id", async (req, res) => {

    try {
        // Number() convierte el parámetro recibido en número.
        const id = Number(req.params.id);

        const { titulo, director } = req.body;


        //-------------------------------------------------
        // VALIDAR EL ID
        //-------------------------------------------------

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                error:
                    "El ID de la película no es válido"
            });
        }


        //-------------------------------------------------
        // BUSCAR LA PELÍCULA ACTUAL
        //-------------------------------------------------

        const peliculaActual =
            peliculas.find(
                (pelicula) => pelicula.id === id
            );

        if (!peliculaActual) {
            return res.status(404).json({
                error:
                    "La película que deseas editar no existe"
            });
        }


        //-------------------------------------------------
        // VALIDAR CAMPOS
        //-------------------------------------------------

        if (
            typeof titulo !== "string" ||
            typeof director !== "string" ||
            !titulo.trim() ||
            !director.trim()
        ) {
            return res.status(400).json({
                error:
                    "El título y el director son obligatorios"
            });
        }


        //-------------------------------------------------
        // VALIDAR LA PELÍCULA EN TMDB
        //-------------------------------------------------

        const peliculaTMDb =
            await buscarPeliculaEnTMDb(titulo);

        if (!peliculaTMDb) {
            return res.status(404).json({
                error:
                    `No se encontró la película "${titulo.trim()}"`
            });
        }


        //-------------------------------------------------
        // VALIDAR EL DIRECTOR
        //-------------------------------------------------

        const directorNormalizado =
            normalizarTexto(director);

        const directorCoincide =
            peliculaTMDb.directores.some(
                (directorOficial) =>
                    normalizarTexto(
                        directorOficial
                    ) === directorNormalizado
            );

        if (!directorCoincide) {
            return res.status(422).json({
                error:
                    `El director "${director.trim()}" no corresponde ` +
                    `a la película "${peliculaTMDb.tituloOficial}"`,

                directoresCorrectos:
                    peliculaTMDb.directores
            });
        }


        //-------------------------------------------------
        // EVITAR DUPLICADOS DURANTE LA EDICIÓN
        //-------------------------------------------------

        // Buscamos otra película con el mismo tmdbId,
        // excluyendo el registro que estamos editando.
        const otraPeliculaDuplicada =
            peliculas.some(
                (pelicula) =>
                    pelicula.id !== id &&
                    pelicula.tmdbId ===
                        peliculaTMDb.tmdbId
            );

        if (otraPeliculaDuplicada) {
            return res.status(409).json({
                error:
                    `La película "${peliculaTMDb.tituloOficial}" ` +
                    "ya está registrada"
            });
        }


        //-------------------------------------------------
        // ACTUALIZAR LOS DATOS
        //-------------------------------------------------

        peliculaActual.tmdbId =
            peliculaTMDb.tmdbId;

        peliculaActual.titulo =
            peliculaTMDb.tituloOficial;

        peliculaActual.director =
            peliculaTMDb.directores.join(", ");

        peliculaActual.fechaEstreno =
            peliculaTMDb.fechaEstreno;

        peliculaActual.portada =
            peliculaTMDb.portada;

        return res.json(
            peliculaActual
        );

    } catch (error) {

        console.error(
            "[PUT /api/peliculas/:id]",
            error.message
        );

        return res.status(502).json({
            error:
                "No fue posible verificar la película en TMDB"
        });
    }
});


//=====================================================
// 14. DELETE: ELIMINAR UNA PELÍCULA
//=====================================================

app.delete("/api/peliculas/:id", (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            error:
                "El ID de la película no es válido"
        });
    }

    // findIndex() devuelve la posición de la película.
    // Si no la encuentra, devuelve -1.
    const index = peliculas.findIndex(
        (pelicula) => pelicula.id === id
    );

    if (index === -1) {
        return res.status(404).json({
            error:
                "Película no encontrada"
        });
    }

    // splice() elimina un elemento del arreglo.
    peliculas.splice(index, 1);

    return res.json({
        mensaje:
            "Película eliminada del catálogo"
    });
});


//=====================================================
// 15. RUTAS QUE NO EXISTEN
//=====================================================

// Esta parte debe colocarse después de las rutas válidas.
app.use((req, res) => {
    return res.status(404).json({
        error:
            "Ruta no encontrada"
    });
});


//=====================================================
// 16. ARRANQUE DEL SERVIDOR
//=====================================================

const PUERTO = 3000;

// Primero completamos los datos y las portadas iniciales.
// Después encendemos el servidor.
//
// De esta forma, cuando el HTML solicite las películas,
// Matrix e Interstellar ya tendrán sus portadas.
completarDatosIniciales()
    .then(() => {

        app.listen(PUERTO, () => {

            console.log(
                `🎬 Servidor activo en http://localhost:${PUERTO}`
            );

            console.log(
                "✅ Portadas iniciales cargadas"
            );

            console.log(
                "✅ Validación de títulos activada"
            );

            console.log(
                "✅ Validación de directores activada"
            );

            console.log(
                "✅ Control de duplicados activado"
            );
        });
    })
    .catch((error) => {

        // Esta captura es una protección adicional.
        // Normalmente completarDatosIniciales ya controla
        // individualmente los errores de cada película.
        console.error(
            "Error durante la preparación inicial:",
            error.message
        );
    });
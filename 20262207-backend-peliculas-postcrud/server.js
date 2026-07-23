//=====================================================
// BACKEND CRUD DE PELÍCULAS - VERSIÓN OPTIMIZADA
//=====================================================
// Requisitos:
// - Node.js 18 o superior (incluye fetch).
// - Archivo .env con TMDB_API_KEY.

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PUERTO = process.env.PORT || 3000;
const TMDB_URL = "https://api.themoviedb.org/3";
const IMAGEN_URL = "https://image.tmdb.org/t/p/w500";

app.use(cors());
app.use(express.json());

// Error controlado: permite responder con un código HTTP concreto.
class ErrorHttp extends Error {
    constructor(estado, mensaje, detalles = {}) {
        super(mensaje);
        this.estado = estado;
        this.detalles = detalles;
    }
}

// Convierte textos a una forma común para compararlos.
function normalizar(texto) {
    return String(texto)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

// Realiza todas las consultas a TMDB desde un único lugar.
async function consultarTmdb(ruta, parametros = {}) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error("TMDB_API_KEY no está configurada en .env");
    }

    const url = new URL(`${TMDB_URL}${ruta}`);
    url.search = new URLSearchParams({
        api_key: apiKey,
        ...parametros
    });

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`TMDB respondió con estado ${respuesta.status}`);
    }

    return respuesta.json();
}

// Busca una coincidencia exacta en español y después en inglés.
async function buscarPeliculaTmdb(tituloBuscado) {
    const tituloNormalizado = normalizar(tituloBuscado);

    for (const idioma of ["es-ES", "en-US"]) {
        console.log(`[TMDB] Buscando "${tituloBuscado}" en ${idioma}`);

        const datos = await consultarTmdb("/search/movie", {
            query: tituloBuscado,
            language: idioma
        });

        const coincidencia = (datos.results || []).find((pelicula) => {
            return (
                normalizar(pelicula.title) === tituloNormalizado ||
                normalizar(pelicula.original_title) === tituloNormalizado
            );
        });

        if (!coincidencia) continue;

        const creditos = await consultarTmdb(
            `/movie/${coincidencia.id}/credits`
        );

        const directores = (creditos.crew || [])
            .filter((persona) => persona.job === "Director")
            .map((persona) => persona.name);

        return {
            tmdbId: coincidencia.id,
            titulo: coincidencia.title,
            tituloOriginal: coincidencia.original_title,
            director: directores.join(", "),
            directores,
            fechaEstreno: coincidencia.release_date || null,
            portada: coincidencia.poster_path
                ? `${IMAGEN_URL}${coincidencia.poster_path}`
                : null
        };
    }

    return null;
}

// Base temporal: se reinicia al apagar el servidor.
const peliculas = [
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

let siguienteId = 3;

function validarCampos(titulo, director) {
    const sonTextos =
        typeof titulo === "string" &&
        typeof director === "string";

    if (!sonTextos || !titulo.trim() || !director.trim()) {
        throw new ErrorHttp(
            400,
            "El título y el director son obligatorios"
        );
    }
}

// Acepta un director individual o la lista oficial completa.
function directorValido(directorIngresado, directoresOficiales) {
    const entrada = normalizar(directorIngresado);
    const opciones = [
        ...directoresOficiales,
        directoresOficiales.join(", "),
        directoresOficiales.join(" y ")
    ];

    return opciones.some((nombre) => normalizar(nombre) === entrada);
}

// Validación compartida por POST y PUT.
async function validarPelicula(titulo, director, idExcluido = null) {
    validarCampos(titulo, director);

    const peliculaTmdb = await buscarPeliculaTmdb(titulo);
    if (!peliculaTmdb) {
        throw new ErrorHttp(
            404,
            `No se encontró la película "${titulo.trim()}" ` +
            "ni en español ni en inglés"
        );
    }

    if (peliculaTmdb.directores.length === 0) {
        throw new ErrorHttp(
            422,
            "TMDB no dispone de información sobre el director"
        );
    }

    if (!directorValido(director, peliculaTmdb.directores)) {
        throw new ErrorHttp(
            422,
            `El director "${director.trim()}" no corresponde ` +
            `a la película "${peliculaTmdb.titulo}"`,
            { directoresCorrectos: peliculaTmdb.directores }
        );
    }

    const duplicada = peliculas.some((pelicula) => {
        return (
            pelicula.id !== idExcluido &&
            pelicula.tmdbId === peliculaTmdb.tmdbId
        );
    });

    if (duplicada) {
        throw new ErrorHttp(
            409,
            `La película "${peliculaTmdb.titulo}" ya está registrada`
        );
    }

    return peliculaTmdb;
}

function validarId(valor) {
    const id = Number(valor);
    if (!Number.isInteger(id)) {
        throw new ErrorHttp(400, "El ID de la película no es válido");
    }
    return id;
}

//=====================================================
// RUTAS CRUD
//=====================================================

app.get("/api/peliculas", (req, res) => {
    res.json(peliculas);
});

app.post("/api/peliculas", async (req, res, next) => {
    try {
        const { titulo, director } = req.body;
        const datos = await validarPelicula(titulo, director);

        const nuevaPelicula = {
            id: siguienteId++,
            tmdbId: datos.tmdbId,
            titulo: datos.titulo,
            director: datos.director,
            fechaEstreno: datos.fechaEstreno,
            portada: datos.portada
        };

        peliculas.push(nuevaPelicula);
        res.status(201).json(nuevaPelicula);
    } catch (error) {
        next(error);
    }
});

app.put("/api/peliculas/:id", async (req, res, next) => {
    try {
        const id = validarId(req.params.id);
        const pelicula = peliculas.find((item) => item.id === id);

        if (!pelicula) {
            throw new ErrorHttp(
                404,
                "La película que deseas editar no existe"
            );
        }

        const { titulo, director } = req.body;
        const datos = await validarPelicula(titulo, director, id);

        Object.assign(pelicula, {
            tmdbId: datos.tmdbId,
            titulo: datos.titulo,
            director: datos.director,
            fechaEstreno: datos.fechaEstreno,
            portada: datos.portada
        });

        res.json(pelicula);
    } catch (error) {
        next(error);
    }
});

app.delete("/api/peliculas/:id", (req, res, next) => {
    try {
        const id = validarId(req.params.id);
        const indice = peliculas.findIndex((item) => item.id === id);

        if (indice === -1) {
            throw new ErrorHttp(404, "Película no encontrada");
        }

        peliculas.splice(indice, 1);
        res.json({ mensaje: "Película eliminada del catálogo" });
    } catch (error) {
        next(error);
    }
});

//=====================================================
// INICIALIZACIÓN Y ERRORES
//=====================================================

async function completarDatosIniciales() {
    await Promise.all(
        peliculas.map(async (pelicula) => {
            try {
                const datos = await buscarPeliculaTmdb(pelicula.titulo);
                if (!datos) return;

                Object.assign(pelicula, {
                    tmdbId: datos.tmdbId,
                    tituloOriginal: datos.tituloOriginal,
                    fechaEstreno: datos.fechaEstreno,
                    portada: datos.portada
                });
            } catch (error) {
                console.error(
                    `[TMDB] No se completó "${pelicula.titulo}":`,
                    error.message
                );
            }
        })
    );
}

app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Un único manejador transforma errores en respuestas JSON.
app.use((error, req, res, next) => {
    if (error instanceof ErrorHttp) {
        return res
            .status(error.estado)
            .json({ error: error.message, ...error.detalles });
    }

    console.error("[ERROR]", error.message);
    return res.status(502).json({
        error: "No fue posible verificar la película en TMDB"
    });
});

completarDatosIniciales().then(() => {
    app.listen(PUERTO, () => {
        console.log(`🎬 Servidor activo en http://localhost:${PUERTO}`);
        console.log("✅ Portadas, validaciones y duplicados activados");
    });
});

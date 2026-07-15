//==================================
//1. IMPORTACIONES
//==================================
const express = require("express");
const cors = require("cors");// Importamos nuestro guardián de seguridad

//=============================================
//2. INICIALIZACIÓN
//=============================================
const app = express();

//=============================================
//3. MIDDLEWARES (CONFIGURACIÓN GLOBAL)
//=============================================
//REGLA DE ORO: ¡CORS SIEMPRE ANTES DE LAS RUTAS!
app.use(cors());// Da permiso a React para entrar sin que el navegador lo bloquee
app.use(express.json());// Traduce el texto entrante a formato JSON

//===============================================
//4. NUESTRA BASE DE DATOS
//===============================================
let videojuegos = [
    {id:1, titulo: "The Legend of Zelda: Breat of the Wild", genero: "Aventura"},
    {id:2, titulo: "Hollow Knight", genero: "Metroidvania"}
];

//================================================
//5. RUTAS DE LA API (CRUD)
//================================================
// Leer el catálogo completo (GET)
app.get("/api/videojuegos", (req,res)=>{
    res.json(videojuegos);
});

//Añadir una videojuegos nueva (POST)
app.post("/api/videojuegos", (req, res) => {
    const { titulo, genero } = req.body;
    //Validación básica para evitar guardar datos vacíos
    if(!titulo || !genero) {
        return res.status(400).json({ error: "Faltan datos obligatorios"});
    }

    const nuevavideojuego = {
        id: videojuegos.length > 0 ? videojuegos[videojuegos.length - 1].id + 1 : 1,
        titulo: titulo,
        genero: genero

    };

    videojuegos.push(nuevavideojuegos);
    res.status(201).json(nuevavideojuegos);
})

//Actualizar una videojuegos existente (PUT)
app.put("/api/videojuegos/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, genero } = req.body;

    //Validación básica: no permitimos guardar datos vacíos
    if (!titulo || !genero) {
        return res.status(400).json({ error: "Faltan datos obligatorios"});
    }

    const videojuegos = videojuegos.find(p => p.id === id);

    if(!videojuego){
        return res.status(404).json({ error: "videojuego no encontrada"});
    }

    //Actualizamos solo los campos, manteniendo el mismo id
    videojuegos.titulo = titulo;
    videojuegos.genero = genero;

    res.json(videojuego);
});

//Eliminar una videojuego (DELETE)

app.delete("/api/videojuegos/:id", (req,res) => {
    const id = parseInt(req.params.id);
    const index = videojuegos.findIndex(p  => p.id === id);

    if(index !== -1){
        videojuegos.splice(index,1);
        res.json({mensaje: "videojuegos eliminada del catálogo"});
    }else {
        res.status(404).json({ error: "videojuegos no encontrada"});
    }
});









//==========================================
//6. ENCENDIDO DEL SERVIDOR
//==========================================
app.listen(3000, () => {
    console.log("🎬 Servidor de videojuegos listo en el puerto 3000 (CORS Activado)");
});
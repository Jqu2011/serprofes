//PRIMER SERVIDOR WEB CON EXPRESS
//1. Importamos la libreria Express.
//Express nos permite crear servidores web en forma sencilla
const express = require("express");
//2. Creamos una libreria con Express.
//La variable "app" sera nuestro servidor
const app = express();
//3. Definimos el puerto donde escuchara el servidor
// En este caso utilizamos el puerto 3000
const PORT = 3000;
//4. Iniciamos el servidor
//Listen()hace que el servidor quede esperando peticiones
//de los clientes (por ejemplo desde un navegador)

//=================================================
//MILDDLEWARE
//==================================================
//Un milddlewarees una función que se ejecuta antes de 
//llegar a las rutas.
//express.jason()convierte automaticamente los datos
//enviados en formato JSON en un objeto JavaScript.
//Gracias a este middleware podremos acceder a :
// req.body
//cuando el cliente envie informacion mediante POST o PUT.
app.use(express.json());

//====================================================
//BASE DE DATOS EN MEMORIA 
//====================================================
//Simulamos una base de datos utilizando un arreglo
//IMPORTANTE:
//Los datos solo existen mientras el servidor está
//encendido
//Si detenemos Node.js, toda esta información se pierde
let tareas = [
    //primera tarea
    {
        id: 1,
        titulo: "Aprender Express",
        completada: false
    },
    // Segunda tarea
    {
        id:2,
        titulo: "Estudiar Node.js",
        completada: true
    },
    // Tercera tarea
    {
        id:3,
        titulo: "Practicar Thunder Client",
        Completada:false
    }

];
//========================================
//RUTA PRINCIPAL
//========================================
app.get("/",(req, res)=> {
    res.send("🚀Bienvenido a la API REST de Tareas");
})



//===============================
//GET - OBTENER TODAS LAS TAREAS
//===============================
// Ruta
// GET /api/tareas
//Devuelve todas las tareas almacenadas.
app.get("/api/tareas", (req, res) => {
    //código HTTP 200 = ok
    //json() convierte automaticamente el arreglo
    // en formato JSON.
    res.status(200).json(tareas);
});

//=================================
//GET - OBTENER UNA TAREA POR SU ID
//=================================
//Ruta
//GET /api/taras/2
//":id significa que el valor es dinamico"
app.get("/api/tareas/:id", (req, res) => {
    //req.params.id llega como texto
    //el programa haceun paseInt() lo convierte a número
    const id = parseInt(req.params.id);
    // Buscamos la tarea cuyo id coincida.
    const tarea = tareas.find(t => t.id === id);
    // Si no existe
    if(!tarea) {
       // Código HTTP 404 = No encontrado
        return res.status(404).json ({
            mensaje: "La tareas no existe"
        });
    }
    // Si existe devolvemos la tarea.
    res.status(200).json(tarea);
}),










app.listen(PORT, ()=> {
    //5. Cuando el servidor se inicia correctamente,
    //mostramos un mensaje en la consola.
    console.log(`👌servidor ejecutandose en http://localhost:${PORT}`);
});

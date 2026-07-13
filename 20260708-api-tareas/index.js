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

//=============================================
//POST - CREAR UNA NUEVA TAREA
//=============================================
//Ruta:
//POST /api/tareas
//Cliente enviará un JSON como:
//{ "titulo": "Estudiar Express " }
app.post("/api/tareas", (req, res) =>{
    // Extraemos el título enviado por el cliente
    const { titulo } = req.body;
    // Validamos que el título exista
    if(!titulo) {
        //Código HTTP = Solicitud incorrecta 
        return res.status(400).json({
            mensaje: "Debe indicar el título de la tarea"
        });
    }
    //Creamos un nuevo objeto
    const nuevaTarea = {
        //Generamos un id automático
        id: tareas.length + 1,
        //Guardamos el título recibido.
        titulo,
        // Toda tarea nueva comienza incompleta
        completada: false
    };
    // Agregamos la nueva tarea al arreglo
    tareas.push(nuevaTarea);
    // Respondemos indicando que fue creada
    res.status(201).json({
        mensaje: "Tarea creada correctamente",
        tarea: nuevaTarea
    }); 
});

//=============================================
// PUT - ACTUALIZAR UNA TAREA
//============================================
//Ruta:
//PUT /api/tareas/1
// Permite modificar una tarea existente
app.put("/api/tareas/:id", (req, res) => {
    // Obtenemos el id enviado en la URL
    const id = parseInt(req.params.id);
    //Buscamos la tarea.
    const tarea = tareas.find(t => t.id === id);
    // Si no existe...
    if(!tarea) {
        return res.status(404).json({
            mensaje: "La tarea no existe"
        });
    }
    // Obtenemos los datos enviados
    const { titulo, completada} = req.body;
    // Si el cliente envía un nuevo título,
    //actualizamos únicamente ese campo.
    //!== "distinto de" undefined significa que una variable
    // o propiedad no existe o no tiene valor
    if (titulo !== undefined) {
        tarea.titulo = titulo;
    }
    //Si el cliente envía el estado,
    // actualizamos únicamente ese campo.
    if (completada !== undefined) {
        tarea.completada = completada
    }
    // Respondemos indicando que todo salió bien
    res.status(200).json({
        mensaje: "Tarea actualizada",
        tarea
    });
});

//=================================================
//DELETE /api/tareas/4
//=================================================
//Ruta:
//DELETE : Elimina una tarea según id.
app.delete("/api/tareas/:id",(req, res) => {
    // Convertimos el parametro a número
    const id = parseInt(req.params.id);
    // Buscamos la posición de la tarea
    // dentro del arreglo
    const indice = tareas.findIndex(t => t.id === id);

    // Si no existe
    if (indice === -1){
        return res.status(404).json ({
            mensaje: "La tarea no existe"
        });
    }

    // Elimanos la tera del arreglo
    // splice(posicion, cantidad)

    tareas.splice(indice,1);

    res.status(200).json({
        mensaje: "Tarea eliminada correctamente"
    });

});


app.listen(PORT, ()=> {
    //5. Cuando el servidor se inicia correctamente,
    //mostramos un mensaje en la consola.
    console.log(`👌servidor ejecutandose en http://localhost:${PORT}`);
});

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
app.listen(PORT, ()=> {
    //5. Cuando el servidor se inicia correctamente,
    //mostramos un mensaje en la consola.
    console.log(`👌servidor ejecutandose en http://localhost:${PORT}`);
});

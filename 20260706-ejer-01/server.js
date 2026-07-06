//1. IMPORTAR HERRAMIENTAS
const express = require('express');
const app = express();

//2. NUESTRA BASE DE DATOS FALSA (EL  catÁlogo)
// Esto es una Array de objetos (JSON)
const inventario = [
      {id: 1, servicio: "Reclutamiento y Selección", ordenes:15},
      {id: 2, servicio: "Evaluación de Personal", ordenes:15},
      {id: 2, servicio: "HR Analytics ", ordenes:22}
];
//3. LA RUTA (Administrativo)
//cuando alguien pida 'api servicios', le entregamos el número de ordenes

app.get('/api/servicio',(req, res) => {
    //res.json convierte los datos para que el internet entienda
    res.json(inventario);
});

//4. ENCENDER EL SERVIDOR 
//Le decimos que escuche en el puerto 3000
app.listen(3000, () => {
    console.log('🎉servidor encendido y escuchando en el puerto 3000');
});
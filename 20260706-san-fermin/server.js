const express = require('express');
const app = express();

// Tu catálogo personalizado de datos (Cambia esto por tu temática favorita)
const misDatosInteres = [
  { id: 1, nombre: "harry potter", categoria: "Ejemplo A", disponible: true },
  { id: 2, nombre: "kun fu panda", categoria: "Ejemplo B", disponible: false } 
];

// Ruta Principal (Mensaje de bienvenida en texto plano)
app.get('/', (req, res) => {
  res.send('Bienvenido a mi servidor personalizado 🚀');
});

// Ruta de la API (Entrega tu lista de datos en formato JSON para internet)
app.get('/api/datos', (req, res) => {
  res.json(misDatosInteres);
});
// Encendemos el motor en el puerto 3000
app.listen(3000, () => {
  console.log('✅ Servidor personalizado funcionando en el puerto 3000');
});  
const express = require('express');
const app = express();

const profesores = [
  { id: 1, nombre: "Ana García", especialidad: "Frontend" },
  { id: 2, nombre: "Carlos Pérez", especialidad: "Backend" },
  { id: 3, nombre: "Julia Querevalu", especialidad: "People Analytics e IA" }
];

const cursos = [
  { id: 1, nombre: "HTML y CSS", nivel: "Inicial" },
  { id: 2, nombre: "JavaScript", nivel: "Intermedio" },
  { id: 3, nombre: "Node.js con Express", nivel: "Backend" }
];

app.get('/', (req, res) => {
  res.send('Servidor activo. Prueba /api/profesores o /api/cursos');
});

app.get('/api/profesores', (req, res) => {
  res.json(profesores);
});

app.get('/api/cursos', (req, res) => {
  res.json(cursos);
});

app.listen(3000, () => {
  console.log('Servidor funcionando en http://localhost:3000');
});
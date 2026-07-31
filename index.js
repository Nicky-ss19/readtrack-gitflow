const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ libros: [] }).write();

const app = express();
app.use(bodyParser.json());

// Crear libro
app.post('/libros', (req, res) => {
  const { titulo, autor, genero, paginasTotales } = req.body;

  const nuevoLibro = {
    id: Date.now(),
    titulo,
    autor,
    genero,
    paginasTotales,
    paginasLeidas: 0,
    estado: 'pendiente',
    calificacion: null,
    fechaInicio: null,
    fechaFin: null
  };

  db.get('libros').push(nuevoLibro).write();
  res.status(201).json(nuevoLibro);
});

// Listar todos los libros
app.get('/libros', (req, res) => {
  const libros = db.get('libros').value();
  res.json(libros);
});

// Obtener un libro por ID
app.get('/libros/:id', (req, res) => {
  const libro = db.get('libros').find({ id: parseInt(req.params.id) }).value();
  if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json(libro);
});

// Actualizar progreso de lectura
app.put('/libros/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const libro = db.get('libros').find({ id }).value();

  if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });

  const { paginasLeidas, estado, calificacion } = req.body;

  if (paginasLeidas > libro.paginasTotales) {
    return res.status(400).json({ error: 'Las páginas leídas no pueden superar el total de páginas' });
  }

  if (paginasLeidas < 0) {
    return res.status(400).json({ error: 'Las páginas leídas no pueden ser negativas' });
  }

  db.get('libros')
    .find({ id })
    .assign({ paginasLeidas, estado, calificacion })
    .write();

  const libroActualizado = db.get('libros').find({ id }).value();
  res.json(libroActualizado);
});

// Eliminar libro
app.delete('/libros/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('libros').remove({ id }).write();
  res.json({ mensaje: 'Libro eliminado correctamente' });
});

// Obtener libros por calificación mínima
app.get('/libros/calificacion/:min', (req, res) => {
  const calificacionMin = parseFloat(req.params.min);
  const libros = db.get('libros')
    .filter(libro => libro.calificacion >= calificacionMin)
    .value();
  res.json(libros);
});

// Buscar libros por género
app.get('/libros/genero/:genero', (req, res) => {
  const generoBuscado = req.params.genero.toLowerCase();
  const libros = db.get('libros')
    .filter(libro => libro.genero.toLowerCase() === generoBuscado)
    .value();
  res.json(libros);
});

// Calcular progreso del reto anual
app.get('/progreso', (req, res) => {
  const libros = db.get('libros').value();
  const totalLibros = libros.length;
  const librosTerminados = libros.filter(l => l.estado === 'terminado').length;
  const metaAnual = 24; // Meta configurable

  res.json({
    totalLibros,
    librosTerminados,
    metaAnual,
    porcentajeProgreso: ((librosTerminados / metaAnual) * 100).toFixed(2) + '%'
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

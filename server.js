const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// Crear servidor
const app = express();
const port = 3000;
app.use(cors());

//Middleware sesiones
app.use(session({
    secret: 'Ek@TpdKM*azmTb9=Ekm[WyXM', // clave
    resave: false, // Evita guardar la sesión si no se ha modificado
    saveUninitialized: true, // Guarda sesiones que aún no han sido inicializadas
    cookie: {
      maxAge: 500000 // Tiempo de expiración de la cookie en milisegundos
    }
}));

// Importar rutas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static('public'));

const routes = require('./services/rutas');
app.use('/', routes);


// Rutas API
const apiRoutes = require('./services/endpoints'); 
app.use("/api", apiRoutes);

// Sirve archivos estáticos desde uploads
app.use('/uploads', express.static('uploads'));

// Middleware para capturar rutas no definidas (404)
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

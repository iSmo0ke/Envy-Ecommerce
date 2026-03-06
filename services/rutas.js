// routes/index.js
const express = require('express');
const router = express.Router();
const path = require('path');

//Middleware usr no autenticado
function authMiddleware(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/?alert=not_authenticated');
    }
}

//Middleware usr autenticado
function redirectAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        res.redirect('/productos');
    } else {
        next();
    }
}

//Middleware para administradores
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === "admin") {
        next(); // Usuario es administrador, permite acceso
    } else {
        res.status(403).json({ error: 'Acceso denegado. No eres administrador.' });
    }
}


// Ruta principal
router.get('/', redirectAuthenticated, (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'index.ejs'));
});

router.get('/administrador', isAdmin, (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'administrador.ejs'));
});


router.get('/ayuda', (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'ayuda.ejs'));
});

router.get('/carrito', authMiddleware, (req, res) => {
    res.render(path.join(__dirname, '..', 'public',  'carrito.ejs'));
});

router.get('/cuenta', authMiddleware, (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'cuenta.ejs'));
});

router.get('/ofertas', authMiddleware, (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'ofertas.ejs'));
});

router.get('/productos', authMiddleware, (req, res) => {
    res.render(path.join(__dirname, '..', 'public', 'productos.ejs'));
});

router.get('/error', (req, res) => {
    res.render('404');
});



module.exports = router;
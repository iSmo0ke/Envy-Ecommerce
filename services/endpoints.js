const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require("./conexion");
const bodyParser = require('body-parser');

// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const app = express();
app.use(express.json());

// Middleware para proteger endpoints
function apiAuthMiddleware(req, res, next) {
    if (req.session && req.session.user) {
        next(); // Usuario autenticado, continúa al endpoint
    } else {
        res.status(401).json({ error: 'No autorizado. Inicia sesión para continuar.' });
    }
}

//Middleware para redirigir usuarios autenticados según su rol
function redirectBasedOnRole(req, res, next) {
    if (req.session && req.session.user) {
        if (req.session.user.role === "admin") {
            res.redirect('/administrador');
        } else {
            res.redirect('/productos');
        }
    } else {
        next();  // Usuario no autenticado
    }
}



// Configurar `multer` para almacenar imágenes en la carpeta `uploads/`
const storage = multer.diskStorage({
    destination: 'uploads/', apiAuthMiddleware,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renombrar archivo
    }
});
const upload = multer({ storage });

// Ruta para agregar productos con imagen
router.post('/agregar', apiAuthMiddleware, upload.single('imagen'), (req, res) => {
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);

    const { nombre, descripcion, precio } = req.body;
    const imagen_url = req.file ? req.file.filename : null; // Guardar solo el nombre del archivo

    if (!nombre || !descripcion || !precio || !imagen_url) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const query = 'INSERT INTO productos (nombre, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, descripcion, precio, imagen_url], (err, result) => {
        if (err) {
            console.error('Error al registrar el producto:', err);
            return res.status(500).send('Error al registrar el producto');
        }
        res.status(200).send('Producto registrado correctamente');
    });
});


//jalar productos
// Endpoint para obtener los productos
router.get('/productos_endpoint', apiAuthMiddleware, (req, res) => {
    const query = 'SELECT * FROM productos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los productos:', err);
            return res.status(500).send('Error al obtener los productos');
        }
        res.status(200).json(results); // Envía los productos al cliente
    });
});

//Ruta para registro
router.post('/register', (req, res) => {
    console.log('Datos recibidos del cliente:', req.body);

    const { nombre, numero_tel, email, password } = req.body;

    if (!nombre || !numero_tel || !email || !password) {
        console.log('Error: Faltan campos obligatorios');
        return res.status(400).send('Todos los campos son obligatorios');
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error al cifrar la contraseña:', err);
            return res.status(500).send('Error al cifrar la contraseña');
        }

        const query = 'INSERT INTO usuarios (nombre, numero_tel, email, password) VALUES (?, ?, ?, ?)';
        db.query(query, [nombre, numero_tel, email, hash], (err, result) => {
            if (err) {
                console.error('Error al registrar el usuario en la BD:', err);
                return res.status(500).send('Error al registrar el usuario');
            }

            console.log('Usuario registrado exitosamente:', result);
            // Responder al cliente con éxito
            res.status(200).send('Usuario registrado correctamente');
        });
    });

});


//Ruta para login
router.post('/login', redirectBasedOnRole, (req, res) => {
    const { email, password } = req.body;

    console.log('Solicitud recibida en /login:', req.body);
    if (!email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0) {
            console.log('Correo no encontrado');
            return res.status(404).send('Correo o contraseña incorrectos');
        }

        const user = results[0];

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error al comparar contraseñas:', err);
                return res.status(500).send('Error en el servidor');
            }

            if (!isMatch) {
                console.log('Contraseña incorrecta');
                return res.status(401).send('Correo o contraseña incorrectos');
            }

            // Si la autenticación es exitosa, guardar el usuario en la sesión
            req.session.user = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.role
            };

            console.log('Usuario autenticado y sesión iniciada:', req.session.user);

            return res.status(200).json({
                message: 'Inicio de sesión exitoso',
                user: req.session.user, // Opcionalmente, devuelve info del usuario al cliente
            });
        });
    });
});


router.post('/logout', (req, res) => {
    if (!req.session.user) {  // Verifica si hay un usuario autenticado
        return res.status(400).json({ message: 'No hay sesión activa' });
    }

    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
});

// Endpoint para eliminar producto
router.delete('/eliminar/:id', (req, res) => {
    const { id } = req.params;

    // Usar db.query() en lugar de execute(), con callbacks
    const query = 'DELETE FROM productos WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: `Producto con ID ${id} eliminado correctamente` });
        } else {
            return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
        }
    });
});

// Endpoint para editar productos
router.put('/editar/:id', apiAuthMiddleware, upload.single('imagen'), (req, res) => {
    const productId = req.params.id;
    const { nombre, descripcion, precio } = req.body;
    let imagen_url = null;

    // Si se subió una nueva imagen
    if (req.file) {
        imagen_url = req.file.filename;
        
        // Primero obtenemos la imagen anterior para eliminarla después
        const getImageQuery = 'SELECT imagen_url FROM productos WHERE id = ?';
        db.query(getImageQuery, [productId], (err, results) => {
            if (err) {
                console.error('Error al obtener la imagen anterior:', err);
                // No detenemos el proceso, solo registramos el error
            } else if (results.length > 0 && results[0].imagen_url) {
                // Eliminar la imagen anterior del sistema de archivos
                const fs = require('fs');
                const path = require('path');
                const oldImagePath = path.join(__dirname, '../uploads', results[0].imagen_url);
                
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Error al eliminar la imagen anterior:', err);
                });
            }
        });
    }

    // Construir la consulta SQL
    let query;
    let params;
    
    if (imagen_url) {
        // Actualizar incluyendo la nueva imagen
        query = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ? WHERE id = ?';
        params = [nombre, descripcion, precio, imagen_url, productId];
    } else {
        // Actualizar sin cambiar la imagen
        query = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ? WHERE id = ?';
        params = [nombre, descripcion, precio, productId];
    }

    // Ejecutar la consulta
    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar el producto:', err);
            return res.status(500).send('Error al actualizar el producto');
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        
        res.status(200).json({ message: 'Producto actualizado correctamente' });
    });
});








module.exports = router;
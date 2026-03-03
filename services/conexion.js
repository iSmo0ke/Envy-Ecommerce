const mysql = require('mysql');

// Conectar a la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1907',
    //password: '122333',
    database: 'tienda_pc'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('Conectado a MySQL');
});

module.exports = db; // Exportar la conexión
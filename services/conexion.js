const mysql = require('mysql');

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'srv1169.hstgr.io',
    user: 'u184537961_admin',
    password: 'envycomD1**.',
    database: 'u184537961_ecommerce',
    port: 3306
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }

    console.log('Conectado a MySQL');

    connection.release();
});

module.exports = db;
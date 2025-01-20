const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MYSQL connection successfully');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
    }
})();

module.exports = pool;
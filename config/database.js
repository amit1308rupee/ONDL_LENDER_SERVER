const mysql = require('mysql2/promise');
const dotenv = require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10, // Adjust the limit based on your needs
    queueLimit: 0
});

async function handleDisconnect() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connection successfully');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
        handleDisconnect(); // Reconnect if the connection is lost
        setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds
    }
}

handleDisconnect();

module.exports = pool;
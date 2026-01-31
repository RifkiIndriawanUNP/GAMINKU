const mysql = require('mysql2/promise')

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaminku',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

const connectDB = async () => {
    try {
        const connection = await pool.getConnection()
        console.log('✅ MySQL Connected to gaminku_db')
        connection.release()
    } 
    catch (error) {
        console.error('❌ Database connection failed:', error.message)
    }
}

module.exports = { pool, connectDB }
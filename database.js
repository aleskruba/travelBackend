const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

class Database {
    constructor() {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME
        });
    }

    async query(sql, values) {
        const [rows] = await this.pool.query(sql, values);
        return rows;
    }

    async execute(sql, values) {
        const [result] = await this.pool.execute(sql, values);
        return result;
    }
    
}

module.exports = Database;

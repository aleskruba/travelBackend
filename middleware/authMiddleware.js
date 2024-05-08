const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
});

const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
            req.user = decodedToken; 

            const [rows] = await pool.query('SELECT * FROM user WHERE id = ?', [req.user.id]);

            if (rows.length > 0) {
                req.user = rows[0]; 
            } else {
                console.log('User not found in the database');
            }
            next();
        } catch (err) {
            console.log('Error verifying token:', err);
            req.user = null;
            next();
        }
    } else {
        req.user = null;
        next();
    }
};

module.exports = { checkUser };

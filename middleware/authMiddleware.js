const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Database = require('../database');

const database = new Database();

dotenv.config();



const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
            req.user = decodedToken; 

            const rows = await database.query('SELECT * FROM user WHERE id = ?', [req.user.id]);

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

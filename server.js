const express = require("express");
const app = express();
const { resolve } = require("path");
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const mysql = require('mysql2');

const authRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 5252;

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traveldb'
});


app.use(express.json());

const corsOptions = {
    origin: [process.env.DEV_CORS_ORIGIN , 'http://localhost:3000'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/", (req, res) => {
    // Execute query within the route handler
    pool.query('SELECT * FROM user', (error, results, fields) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).send('Error executing query');
            return;
        }
    
        res.send('Query executed successfully');
    });
});

app.use(authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
//const mysql = require('mysql2');
const bodyParser = require('body-parser');



const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const tourRoutes = require('./routes/tourRoutes');

const PORT = process.env.PORT || 5252;

app.use(express.json());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


const corsOptions = {
    origin: [process.env.DEV_CORS_ORIGIN , 'http://localhost:3000'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.get('/api', (req, res) => {
    res.send('server test');
  });
  

app.use(authRoutes,messageRoutes,tourRoutes);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




// TESTING DATABASE


/* async function testDatabaseConnection() {
    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Release the connection back to the pool
        connection.release();

        console.log('Database connection successful.');
    } catch (error) {
        console.error('Error connecting to database:', error.message);
    } finally {
        // Close the pool to ensure all connections are closed when done
        await pool.end();
    }
}

// Call the function to test the database connection
testDatabaseConnection(); */

/* async function showTables() {
    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Query to fetch tables
        const [rows] = await connection.query('SHOW TABLES');

        // Release the connection back to the pool
        connection.release();

        // Log the tables
        console.log('Tables in the database:');
        for (let row of rows) {
            console.log(row[`Tables_in_${process.env.DB_NAME}`]);
        }
    } catch (error) {
        console.error('Error fetching tables:', error.message);
    } finally {
        // Close the pool to ensure all connections are closed when done
        await pool.end();
    }
}

// Call the function to show tables
showTables();
 */

/* 
async function findDatabaseName() {
    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Query to fetch the name of the database
        const [rows] = await connection.query('SELECT DATABASE() AS db_name');

        // Release the connection back to the pool
        connection.release();

        // Log the name of the database
        console.log('Name of the connected database:', rows[0].db_name);
    } catch (error) {
        console.error('Error fetching database name:', error.message);
    } finally {
        // Close the pool to ensure all connections are closed when done
        await pool.end();
    }
}

// Call the function to find the name of the connected database
findDatabaseName(); */

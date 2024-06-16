const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Database = require('../database');
const otpGenerator = require('otp-generator')

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



const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        console.log('no token')
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};


async function verifyUser(req, res, next){

    const { email} = req.body;
      try {
        
        const rows = await database.query('SELECT * FROM user WHERE email = ?', [email]);
    
        if (rows.length > 0) {
            req.user = rows[0]; 
            
            next();
        } else {
            console.log('User not found in the database');
            return res.status(404).send({ error: "Email nenalezen"});
        }


  
    } catch (error) {
        return res.status(404).send({ error: "Authentication Error"});
    }
  }

  async function generateOTP(length) {
    try {
      const otp = await otpGenerator.generate(length, {
        upperCaseAlphabets: false,
        specialChars: false,
      });
      return otp;
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
}



module.exports = { checkUser,verifyUser,generateOTP,verifyToken };

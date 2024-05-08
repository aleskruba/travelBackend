const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
});

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '10d'
    });
};

const createRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '360d'
    });
};


module.exports.refresh_token_post = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const accessToken = createToken(decoded.id);
    res.cookie('jwt', accessToken, { httpOnly: true, 
                                     maxAge: 5 * 24 * 60* 60 * 1000,
                                    secure:true,
                                    sameSite:'none'});
    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

module.exports.signup_post = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    try {
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const [existingUser] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
       
            return res.status(400).json('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newUser] = await pool.query('INSERT INTO user (email, password) VALUES (?, ?)', [email, hashedPassword]);

        const accessToken = createToken(newUser.insertId);
        const refreshToken = createRefreshToken(newUser.insertId);

        res.cookie('jwt', accessToken, {
            httpOnly: true,
            maxAge: 5 * 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: 'none'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: 'none'
        });

        res.status(201).json({
            message: 'Registrace proběhla úspěšně',
            user: {
                id: newUser.insertId,
                email: email,
             
            },
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        console.error('Error signing up:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json('User with this email already exists');
        }
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};


module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
   
        const [users] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        
          if (users.length === 0) {
            return res.status(400).json({ error: 'Špatný email nebo heslo' });
        }

        const user = users[0];
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Špatný email nebo heslo' });
        }

        const accessToken = createToken(user.id);
        const refreshToken = createRefreshToken(user.id);

        res.cookie('jwt', accessToken, {
            httpOnly: true,
            maxAge: 5 * 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: 'none'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: true,
            sameSite: 'none'
        });

        res.status(201).json({
            message: 'Přihlášení proběhlo úspěšně',
            user:user,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

module.exports.google_auth_post_signup = async (req, res) => {
    try {
        // Extract necessary data from the request body
        const { email, name, profilePicture } = req.body;


        // Check if the user exists in the database based on the email
        let [rows] = await pool.query('SELECT * FROM User WHERE email = ?', [email]);

        if (rows.length === 0) {
            // User does not exist, create a new user entry in the database
            const [newUser] = await pool.query('INSERT INTO User (email, firstName, image, googleEmail,googleName,googleProfilePicture) VALUES (?, ?, ?, ?, ?, ?)', [email, name, profilePicture,email, name, profilePicture]);

            // Generate access token and refresh token for the new user
            const accessToken = createToken(newUser.insertId);
            const refreshToken = createRefreshToken(newUser.insertId);

     
            res.cookie('jwt', accessToken, {
                httpOnly: true,
                maxAge: 5 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });
    
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });

            // Send the tokens back to the frontend
            res.status(201).json({
                message: 'Registrace proběhla úspěšně',
                user: {
                    id: newUser.insertId,
                    email: email,
                    image:profilePicture,
                    name:name
                },
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        } else {
            // User already exists, send a message indicating that the user is already registered
            return res.status(400).json({error:'User with this email already exists'});
        }
    } catch (error) {
        console.error('Error during Google authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports.google_auth_post_login = async (req, res) => {

    const { email} = req.body;
   

    try {

         let [rows] = await pool.query('SELECT * FROM User WHERE googleEmail = ?', [email]);

         console.log("rows",rows)

        if (rows.length === 0) {
               return res.status(404).json({ error: 'Uživatel není zaregistrován' });
        } else {

            user = rows[0];

            const accessToken = createToken(user.id);
            const refreshToken = createRefreshToken(user.id);
    
            res.cookie('jwt', accessToken, {
                httpOnly: true,
                maxAge: 5 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });
    
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                secure: true,
                sameSite: 'none'
            });

            return res.status(201).json({
                message: 'Příhlašení proběhlo úspěšně',
                user:user,
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        }
    } catch (error) {
        console.error('Error during Google authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports.logout_get = async (req, res,next) => {

    try {
        res.cookie('jwt', '', { maxAge: 1, 
          httpOnly: true, 
          secure: true, 
          sameSite: 'none' });
          res.cookie('refreshToken', '', { maxAge: 1, 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none' });
        res.status(201).json({ message: 'Úspěšně odhlášen'});
    
    } catch (err) {
      console.log(err);
      res.status(500).json('Internal server error' );
    }
  };
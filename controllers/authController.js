const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('../database');
const axios = require('axios');

const database = new Database();

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

        const existingUser = await database.query('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
       
            return res.status(400).json('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await database.execute('INSERT INTO user (email, password) VALUES (?, ?)', [email, hashedPassword]);

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
            message: 'Registration successful',
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
            return res.status(400).json('User already exists');
        }
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const users = await database.query('SELECT * FROM user WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
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
            message: 'Login successful',
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports.google_auth_post_signup = async (req, res) => {
    try {

        const { email, name, profilePicture } = req.body;

        let rows = await database.query('SELECT * FROM user WHERE email = ?', [email]);

        if (rows.length === 0) {
            const newUser = await database.query('INSERT INTO user (email, firstName, image, googleEmail,googleName,googleProfilePicture) VALUES (?, ?, ?, ?, ?, ?)', [email, name, profilePicture,email, name, profilePicture]);

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
                    image:profilePicture,
                    name:name
                },
                accessToken: accessToken,
                refreshToken: refreshToken
            });
        } else {
               return res.status(400).json({error:'Uživatel s tímto emailem již existuje'});
        }
    } catch (error) {
        console.error('Error during Google authentication:', error);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};



module.exports.google_auth_post_login = async (req, res) => {

    const { email} = req.body;
   

    try {

         let rows = await database.query('SELECT * FROM user WHERE googleEmail = ?', [email]);

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
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};

module.exports.updateProfile = async (req, res) => {
    const token = req.cookies.jwt;
    const updateProfile = req.body;
    const userId = updateProfile.id;
    const username = updateProfile.username;
    const firstName = updateProfile.firstName;
    const lastName = updateProfile.lastName;
    const email = updateProfile.email;

    try {
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const sql = `UPDATE user SET username=?, firstName=?, lastName=?, email=? WHERE id=?`;

        await database.query(sql, [username, firstName, lastName, email, userId]);

        const accessToken = createToken(updateProfile.id);
        const refreshToken = createRefreshToken(updateProfile.id);

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
            message: 'update proběhl úspěšně',
            accessToken: accessToken,
            refreshToken: refreshToken
        });

    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}

module.exports.updatePassword = async (req, res, next) => {
    const token = req.cookies.jwt;
    const newPassword = req.body;
    const password = newPassword.password;
    const confirmPassword = newPassword.confirmPassword;

    try {
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        if (password !== confirmPassword) {
            return res.status(401).json({ error: 'Hesla nejsou stejná '});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `UPDATE user SET password=? WHERE id=?`;
        await database.query(sql, [hashedPassword, userId]);

 
        const accessToken = createToken(userId);
        const refreshToken = createRefreshToken(userId);


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
            message: 'Heslo úspěšně změněno',
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}


module.exports.uploadprofileimage = async (req, res, next) => {
    const token = req.cookies.jwt;
    const base64String = req.body.image; // Accessing the base64 string from req.body

    try {
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const cloudinaryUrl = process.env.PUBLIC_CLOUDINARY_URL;

        if (!cloudinaryUrl) {
            console.error("Cloudinary URL is not defined!");
            return res.status(500).json({ error: 'Cloudinary URL is not defined' });
        }

        if (!base64String) {
            // Handle case where base64String is not defined
            console.error('No image selected for upload');
            return res.status(400).json({ error: 'No image selected for upload' });
        }

        // Directly send the base64 string to Cloudinary
        const cloudinaryUploadResponse = await axios.post(
            cloudinaryUrl,
            {
                file: base64String,
                upload_preset: 'schoolapp', // Set your Cloudinary upload preset here
            }
        );

        const imageUrl = cloudinaryUploadResponse.data.secure_url;

        const sql = `UPDATE user SET image=? WHERE id=?`;
        await database.query(sql, [imageUrl, userId]);


        res.status(201).json({ imageUrl      });
    } catch (error) {
        console.error('Error during uploading image:', error);
        res.status(500).json({ error: 'Server error' });
    }
}


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
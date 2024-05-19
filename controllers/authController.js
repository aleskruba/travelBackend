const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('../database');
const axios = require('axios');
const validator = require('validator')
const nodemailer = require('nodemailer');
const { generateOTP } = require('../middleware/authMiddleware');
const {createToken,createRefreshToken,createResetPasswordToken} = require('../jwt/jwtControllers');


const database = new Database();

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
            return res.status(400).json({ error: 'Hesla nejsou stejná '});
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Špatný formát emailu' });
        }

        if (email.trim().length < 4 || email.trim().length > 50) {
            return res.status(400).json({ error: 'E-mail musí mít 4 až 50 znaků' });
        }

        if (password.trim().length < 8 || password.trim().length > 50) {
            return res.status(400).json({ error: 'Heslo musí mít 8 až 50 znaků' });
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
            message: 'Příhlášení proběhlo úspěšně',
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
                    id: newUser,
                    googleEmail: email,
                    email: email,
                    image:profilePicture,
                    googleProfilePicture: profilePicture,
                    firstName:name
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
    const username = updateProfile.username ?? null;
    const firstName = updateProfile.firstName ?? null;
    const lastName = updateProfile.lastName ?? null;
    const email = updateProfile.email;
    const googleEmail=updateProfile.googleEmail

console.log(username.length)
    try {
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Špatný formát emailu' });
        }

        if
         (email.trim().length < 4 || email.trim().length > 50) {
            return res.status(400).json({ error: 'E-mail musí mít 4 až 50 znaků' });
        }

        if ((username && username.trim().length > 0) || 
            (firstName && firstName.trim().length > 0) || 
            (lastName && lastName.trim().length > 0)) {

                if (username && (username.trim().length < 4 || username.trim().length > 15)) {
                    return res.status(400).json({ error: 'Username musí mít 4 až 15 znaků' });
                }

                if (firstName && (firstName.trim().length < 2 || firstName.trim().length > 20)) {
                    return res.status(400).json({ error: 'Jméno musí mít 2 až 20 znaků' });
                }

                if (lastName && (lastName.trim().length < 2 || lastName.trim().length > 20)) {
                    return res.status(400).json({ error: 'Příjmeni musí mít 2 až 20 znaků' });
                }
            }
      console.log('is 0 ')
      
        if  (googleEmail) {
            const sql = `UPDATE user SET username=?, firstName=?, lastName=? WHERE id=?`;
            await database.query(sql, [username, firstName, lastName,  userId]);
        } else {
        const sql = `UPDATE user SET username=?, firstName=?, lastName=?, email=? WHERE id=?`;
        await database.query(sql, [username, firstName, lastName, email, userId]);
        }
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

        if (password.trim().length < 8 || password.trim().length > 50) {
            return res.status(400).json({ error: 'Heslo musí mít 8 až 50 znaků' });
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




module.exports.sendOTP = async (req, res) => {
    const { email } = req.body;

    try {

        const otp = await generateOTP(4)


        let transporter = nodemailer.createTransport({
            host: process.env.EMAILHOST,
            port: process.env.EMAILPORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAILUSER,
                pass: process.env.EMAILPASSWORD,
            },
        });

        let mailOptions = {
            from: process.env.EMAILUSER,
            to: email,
            subject: 'TEST ZAPOMENUTÉHO HESLA',
            text: ` ${email}, NOVÝ KÓD ${otp}`,
            html: `<b>${otp}</b>`, // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Email sending failed' });
            } else {
                console.log('Email sent:', info.response);
                const accessToken = createResetPasswordToken(otp,email);
                
                res.cookie('jwtforgottenpassword', accessToken, {
                    httpOnly: true,
                    maxAge: 5* 60 * 1000,
                    secure: true,
                    sameSite: 'none'
                });


                res.status(201).json({ message: 'OTP sent successfully!' });
            }
        });

    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};


module.exports.verifyOTP = async (req, res, next) => {
    const token = req.cookies.jwtforgottenpassword;
    const values = req.body;

    try {
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        console.log('values:',values)
        console.log(decodedToken)

        if (values.otp === decodedToken.id) {

   
            res.status(201).json({ message: 'Kód úspěšně ověřen' });
        }
        else {
            res.status(401).json({ message: 'Chybný kód' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Chybný kód' });
    }

}




module.exports.resetPassword = async (req, res, next) => {
    const token = req.cookies.jwtforgottenpassword;
    const values = req.body;
    const password = values.password;
    const confirmPassword = values.confirmPassword;
    console.log(values)
    try {
       if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const tokenId = decodedToken.id;
        const userEmail = decodedToken.email;
        console.log(tokenId,userEmail);
         if (password !== confirmPassword) {
            return res.status(401).json({ error: 'Hesla nejsou stejná '});
        }

        if (password.trim().length < 8 || password.trim().length > 50) {
            return res.status(400).json({ error: 'Heslo musí mít 8 až 50 znaků' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `UPDATE user SET password=? WHERE email=?`;
        await database.query(sql, [hashedPassword, userEmail]);

        const users = await database.query('SELECT * FROM user WHERE email = ?', [userEmail]);
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
 
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

        const newAccessToken = createResetPasswordToken('1','1');


            res.cookie('jwtforgottenpassword', newAccessToken, {
                httpOnly: true,
                maxAge: 0, // or set a new expiration time if needed
                secure: true,
                sameSite: 'none'
            });
      
        res.status(201).json({
            message: 'Heslo úspěšně změněno',
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
        }); 

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}

module.exports.checkResetPasswordToken = async (req, res, next) => {

    const token = req.cookies.jwtforgottenpassword	;
    const value = req.body
    console.log(value);
    try {
         if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        } 
        console.log('checkResetPasswordToken',token);
        return res.status(201).json({ message: 'You are allowed to change the password',}); 
    } catch (error) {
        return res.status(401).json({ message: 'You are allowed to change the password',}); 
      throw error;
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

        if (password.trim().length < 8 || password.trim().length > 50) {
            return res.status(400).json({ error: 'Heslo musí mít 8 až 50 znaků' });
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
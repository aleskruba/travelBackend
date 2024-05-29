const { Router } = require('express');
const authController = require('../controllers/authController');
const { checkUser, verifyUser,verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.post('/api/signup', authController.signup_post);
router.post('/api/login', authController.login_post);
router.get('/api/logout', authController.logout_get);
router.post('/api/googleauthSignUp', authController.google_auth_post_signup);
router.post('/api/googleauthLogin', authController.google_auth_post_login);
router.put('/api/updateprofile',verifyToken, authController.updateProfile)
router.put('/api/updatepassword',verifyToken,authController.updatePassword)
router.put('/api/uploadprofileimage',verifyToken,authController.uploadprofileimage)
router.post('/api/sendotp', verifyUser, authController.sendOTP);
router.post('/api/verifyotp',  authController.verifyOTP);
router.put('/api/resetpassword',  authController.resetPassword);
router.post('/api/checkResetPasswordToken',  authController.checkResetPasswordToken);



router.get('/api/checkuser', checkUser, (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } 
 
});



module.exports = router;
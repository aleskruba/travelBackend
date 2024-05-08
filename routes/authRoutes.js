const { Router } = require('express');
const authController = require('../controllers/authController');
const { checkUser } = require('../middleware/authMiddleware');

const router = Router();

router.post('/api/signup', authController.signup_post);
router.post('/api/login', authController.login_post);
router.get('/api/logout', authController.logout_get);
router.post('/api/googleauthSignUp', authController.google_auth_post_signup);
router.post('/api/googleauthLogin', authController.google_auth_post_login);


router.get('/api/checkuser', checkUser, (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } 
 
});



module.exports = router;
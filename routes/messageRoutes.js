const { Router } = require('express');
const authController = require('../controllers/messageController');

const router = Router();

router.get('/api/getmessages/:id', authController.getMessages);
router.post('/api/createmessage', authController.createMessage);
router.delete('/api/deletemessage', authController.deleteMessage);

router.get('/api/getreplies/:id', authController.getReplies);
router.post('/api/createreply', authController.createReply);
router.delete('/api/deletereply', authController.deleteReply);

module.exports = router;
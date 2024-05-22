const { Router } = require('express');
const messageController = require('../controllers/messageController');

const router = Router();

router.get('/api/getmessages/:id', messageController.getMessages);
router.post('/api/createmessage', messageController.createMessage);
router.delete('/api/deletemessage', messageController.deleteMessage);

router.get('/api/getreplies/:id', messageController.getReplies);
router.post('/api/createreply', messageController.createReply);
router.delete('/api/deletereply', messageController.deleteReply);


router.get('/api/getblogs/:id', messageController.getBlogs);
router.post('/api/createblog', messageController.createBlog);
//router.delete('/api/deletereply', messageController.deleteReply);


module.exports = router;
const { Router } = require('express');
const messageController = require('../controllers/messageController');
const {verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/messages/:id', messageController.getMessages);
router.post('/api/message',verifyToken, messageController.createMessage);
router.delete('/api/message',verifyToken, messageController.deleteMessage);

router.get('/api/replies/:id', messageController.getReplies);
router.post('/api/reply',verifyToken, messageController.createReply);
router.delete('/api/reply',verifyToken, messageController.deleteReply);


router.get('/api/blogs/:id', messageController.getBlogs);
router.post('/api/blogs',verifyToken, messageController.createBlog);
router.put('/api/blogs',verifyToken, messageController.updateBlog);
router.delete('/api/blogs',verifyToken, messageController.deleteBlog);


router.get('/api/yourblogs/',verifyToken, messageController.getYourBlogs);


router.get('/api/:country/votes', messageController.getVotes);
router.post('/api/:country/vote',messageController.postVote);

module.exports = router;
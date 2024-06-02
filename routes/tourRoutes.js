const { Router } = require('express');
const tourController = require('../controllers/tourController');
const {verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tours', tourController.getTours);
router.get('/api/tours/:id', tourController.getTour);
router.post('/api/tours',verifyToken, tourController.createTour);


router.get('/api/yourtours',verifyToken, tourController.getYourTours);
router.get('/api/yourtours/id',verifyToken, tourController.getYourTour);
router.put('/api/yourtours',verifyToken, tourController.updateYourTour);
router.delete('/api/yourtours',verifyToken, tourController.deleteYourTour);

router.get('/api/tourmessages/:id', tourController.getTourMessages);
router.post('/api/tourmessages', verifyToken,tourController.createTourMessage);
router.delete('/api/tourmessage',verifyToken, tourController.deleteTourMessage);

router.get('/api/tourreplies/:id',verifyToken, tourController.getTourReplies);
router.post('/api/tourreplies', verifyToken,tourController.createTourReply);
router.delete('/api/tourreplies',verifyToken, tourController.deleteTourReply);

module.exports = router;
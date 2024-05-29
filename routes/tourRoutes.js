const { Router } = require('express');
const tourController = require('../controllers/tourController');
const {verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/api/tours', tourController.getTours);
router.get('/api/tours/:id', tourController.getTour);
router.post('/api/tours',verifyToken, tourController.createTour);
router.delete('/api/tours',verifyToken, tourController.deleteTour);

router.get('/api/tourmessages/:id', tourController.getTourMessages);
router.post('/api/tourmessages', verifyToken,tourController.createTourMessage);


module.exports = router;
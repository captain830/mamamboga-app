const express = require('express');
const DeliveryController = require('../controllers/delivery.controller');
const { authMiddleware, adminMiddleware, driverMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin routes
router.post('/assign', authMiddleware, adminMiddleware, DeliveryController.assignDelivery);
router.get('/', authMiddleware, adminMiddleware, DeliveryController.getAllDeliveries);

// Driver routes
router.get('/my-deliveries', authMiddleware, driverMiddleware, DeliveryController.getMyDeliveries);
router.put('/:deliveryId/status', authMiddleware, driverMiddleware, DeliveryController.updateDeliveryStatus);

// Customer routes
router.get('/track/:orderId', authMiddleware, DeliveryController.trackDelivery);

module.exports = router;
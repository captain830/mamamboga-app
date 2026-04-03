const express = require('express');
const OrderController = require('../controllers/order.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { orderValidation, validate } = require('../utils/validation');

const router = express.Router();

router.post('/', authMiddleware, validate(orderValidation.create), OrderController.createOrder);
router.get('/my-orders', authMiddleware, OrderController.getUserOrders);
router.get('/all', authMiddleware, adminMiddleware, OrderController.getAllOrders);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.put('/:id/status', authMiddleware, adminMiddleware, OrderController.updateOrderStatus);
router.post('/:id/cancel', authMiddleware, OrderController.cancelOrder);

module.exports = router;
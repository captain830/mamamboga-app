const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/mpesa/stkpush', authMiddleware, PaymentController.initiateSTKPush);
router.post('/mpesa/callback', PaymentController.handleCallback);
router.get('/status/:orderId', authMiddleware, PaymentController.checkPaymentStatus);
router.get('/history', authMiddleware, PaymentController.getPaymentHistory);

module.exports = router;
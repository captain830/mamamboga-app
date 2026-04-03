const express = require('express');
const ProductController = require('../controllers/product.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Public routes
router.get('/', ProductController.getAllProducts);
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/low-stock', authMiddleware, adminMiddleware, ProductController.getLowStockProducts);
router.get('/:id', ProductController.getProductById);

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 5), ProductController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 5), ProductController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, ProductController.deleteProduct);
router.patch('/:id/stock', authMiddleware, adminMiddleware, ProductController.updateStock);

module.exports = router;
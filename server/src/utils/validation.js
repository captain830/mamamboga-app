const { body, validationResult } = require('express-validator');

// Common validation rules
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Product validation rules
const productValidation = {
  create: [
    body('name').notEmpty().withMessage('Product name required'),
    body('category').notEmpty().withMessage('Category required'),
    body('price').isNumeric().withMessage('Valid price required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock required')
  ],
  update: [
    body('name').optional().notEmpty(),
    body('price').optional().isNumeric(),
    body('stock').optional().isInt({ min: 0 })
  ]
};

// Order validation rules
const orderValidation = {
  create: [
    body('items').isArray().withMessage('Items required'),
    body('items.*.product_id').isInt(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('delivery_type').isIn(['pickup', 'delivery'])
  ]
};

// Auth validation rules
const authValidation = {
  register: [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').notEmpty().withMessage('Phone required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  login: [
    body('email').isEmail(),
    body('password').notEmpty()
  ]
};

module.exports = {
  validate,
  productValidation,
  orderValidation,
  authValidation
};
const { pool } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

class ProductController {
  // Get all products with filters
  async getAllProducts(req, res) {
    try {
      const { 
        category, 
        search, 
        minPrice, 
        maxPrice, 
        featured, 
        limit = 50, 
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      let query = `
        SELECT p.*, 
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.is_available = true
      `;
      const params = [];
      let paramIndex = 1;

      if (category && category !== 'all') {
        query += ` AND p.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (minPrice) {
        query += ` AND p.price >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice) {
        query += ` AND p.price <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      if (featured === 'true') {
        query += ` AND p.featured = true`;
      }

      query += ` GROUP BY p.id ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM products WHERE is_available = true';
      const countParams = [];
      let countIndex = 1;
      
      if (category && category !== 'all') {
        countQuery += ` AND category = $${countIndex}`;
        countParams.push(category);
        countIndex++;
      }
      
      const countResult = await pool.query(countQuery, countParams);
      
      res.json({
        products: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  }

  // Get single product
  async getProductById(req, res) {
    try {
      const result = await pool.query(
        `SELECT p.*, 
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(r.id) as review_count,
          json_agg(DISTINCT jsonb_build_object(
            'id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'user_name', u.name,
            'created_at', r.created_at
          )) FILTER (WHERE r.id IS NOT NULL) as reviews
         FROM products p
         LEFT JOIN reviews r ON p.id = r.product_id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE p.id = $1
         GROUP BY p.id`,
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  }

  // Create product (admin only)
  async createProduct(req, res) {
    const { 
      name, category, subcategory, price, cost_price, stock, unit, 
      description, featured, discount_percentage, discount_start_date, discount_end_date 
    } = req.body;

    try {
      let image_url = null;
      let images = [];
      
      // Handle image uploads
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
        const uploadResults = await Promise.all(uploadPromises);
        images = uploadResults.map(result => result.url);
        image_url = images[0];
      }

      const result = await pool.query(
        `INSERT INTO products (
          name, category, subcategory, price, cost_price, stock, unit, 
          image_url, images, description, featured, discount_percentage, 
          discount_start_date, discount_end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          name, category, subcategory || null, price, cost_price || null, stock, unit || 'kg',
          image_url, JSON.stringify(images), description || null, featured || false,
          discount_percentage || 0, discount_start_date || null, discount_end_date || null
        ]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  }

  // Update product
  async updateProduct(req, res) {
    const { id } = req.params;
    const updates = req.body;

    try {
      const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (currentProduct.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Build dynamic update query
      const allowedFields = [
        'name', 'category', 'subcategory', 'price', 'cost_price', 'stock', 'unit',
        'description', 'is_available', 'featured', 'discount_percentage',
        'discount_start_date', 'discount_end_date'
      ];
      
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(updates[field]);
          paramIndex++;
        }
      }

      // Handle image updates
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
        const uploadResults = await Promise.all(uploadPromises);
        const newImages = uploadResults.map(result => result.url);
        const currentImages = currentProduct.rows[0].images || [];
        const updatedImages = [...currentImages, ...newImages];
        
        updateFields.push(`images = $${paramIndex}`);
        values.push(JSON.stringify(updatedImages));
        paramIndex++;
        
        if (!updates.image_url && newImages[0]) {
          updateFields.push(`image_url = $${paramIndex}`);
          values.push(newImages[0]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      values.push(id);
      const query = `UPDATE products SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    const { id } = req.params;

    try {
      const product = await pool.query('SELECT image_url, images FROM products WHERE id = $1', [id]);
      
      if (product.rows.length > 0) {
        // Delete images from cloudinary
        const images = product.rows[0].images || [];
        if (product.rows[0].image_url) images.push(product.rows[0].image_url);
        
        for (const imageUrl of images) {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await deleteFromCloudinary(publicId);
        }
      }

      const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  }

  // Update stock
  async updateStock(req, res) {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    try {
      let query;
      if (operation === 'add') {
        query = 'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *';
      } else if (operation === 'subtract') {
        query = 'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *';
      } else {
        query = 'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *';
      }

      const result = await pool.query(query, [quantity, id]);
      
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Insufficient stock or product not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ message: 'Failed to update stock' });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    const { threshold = 10 } = req.query;

    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE stock <= $1 AND is_available = true ORDER BY stock ASC',
        [threshold]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({ message: 'Failed to fetch low stock products' });
    }
  }

  // Get featured products
  async getFeaturedProducts(req, res) {
    const { limit = 10 } = req.query;

    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE featured = true AND is_available = true ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({ message: 'Failed to fetch featured products' });
    }
  }
}

module.exports = new ProductController();
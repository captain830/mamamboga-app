const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email.service');
const { createNotification } = require('../utils/notification.service');

class OrderController {
  // Create new order
  async createOrder(req, res) {
    const { items, delivery_type, delivery_address, delivery_instructions, customer_notes, scheduled_delivery_time } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let subtotal = 0;
      const orderItems = [];

      // Validate stock and calculate subtotal
      for (const item of items) {
        const productResult = await client.query(
          'SELECT price, stock, name FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );
        
        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        
        const product = productResult.rows[0];
        
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
          name: product.name
        });
      }

      const delivery_fee = delivery_type === 'delivery' ? 100 : 0;
      const tax = subtotal * 0.16; // 16% VAT
      const total_amount = subtotal + delivery_fee + tax;

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, subtotal, delivery_fee, tax, total_amount, 
          delivery_type, delivery_address, delivery_instructions, 
          customer_notes, scheduled_delivery_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          req.user.id, subtotal, delivery_fee, tax, total_amount,
          delivery_type, delivery_address || null, delivery_instructions || null,
          customer_notes || null, scheduled_delivery_time || null
        ]
      );

      const order = orderResult.rows[0];

      // Add order items and update stock
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.price]
        );
        
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');

      // Send confirmation email
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmation #${order.order_number}`,
        template: 'order-confirmation',
        data: {
          order_number: order.order_number,
          items: orderItems,
          subtotal,
          delivery_fee,
          tax,
          total: total_amount,
          delivery_type,
          delivery_address
        }
      });

      // Create notification
      await createNotification({
        userId: req.user.id,
        title: 'Order Confirmed',
        message: `Your order #${order.order_number} has been received`,
        type: 'success',
        metadata: { order_id: order.id }
      });

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status,
          delivery_type: order.delivery_type
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create order error:', error);
      res.status(500).json({ message: error.message || 'Failed to create order' });
    } finally {
      client.release();
    }
  }

  // Get user orders
  async getUserOrders(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT o.*, 
          json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = $1
      `;
      const params = [req.user.id];
      let paramIndex = 2;

      if (status) {
        query += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM orders WHERE user_id = $1',
        [req.user.id]
      );
      
      res.json({
        orders: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  }

  // Get single order
  async getOrderById(req, res) {
    try {
      const result = await pool.query(
        `SELECT o.*, 
          u.name as customer_name, u.email, u.phone,
          json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )) as items
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'admin')
         GROUP BY o.id, u.name, u.email, u.phone`,
        [req.params.id, req.user.id, req.user.role]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  }

  // Update order status (admin)
  async updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    try {
      const result = await pool.query(
        'UPDATE orders SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, admin_notes, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const order = result.rows[0];
      
      // Send notification to user
      await createNotification({
        userId: order.user_id,
        title: `Order ${status.toUpperCase()}`,
        message: `Your order #${order.order_number} is now ${status}`,
        type: status === 'delivered' ? 'success' : 'info',
        metadata: { order_id: order.id }
      });
      
      res.json({
        message: 'Order status updated',
        order
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        'SELECT status, user_id, order_number FROM orders WHERE id = $1 FOR UPDATE',
        [id]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const order = orderResult.rows[0];
      
      if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }
      
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
      }

      // Restore stock
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );
      
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', id]
      );

      await client.query('COMMIT');
      
      // Send cancellation notification
      await createNotification({
        userId: order.user_id,
        title: 'Order Cancelled',
        message: `Your order #${order.order_number} has been cancelled`,
        type: 'warning',
        metadata: { order_id: id }
      });
      
      res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Cancel order error:', error);
      res.status(500).json({ message: 'Failed to cancel order' });
    } finally {
      client.release();
    }
  }

  // Get all orders (admin)
  async getAllOrders(req, res) {
    try {
      const { status, start_date, end_date, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT o.*, u.name as customer_name, u.email, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (start_date) {
        query += ` AND o.created_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND o.created_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM orders';
      const countParams = [];
      if (status) {
        countQuery += ' WHERE status = $1';
        countParams.push(status);
      }
      const countResult = await pool.query(countQuery, countParams);
      
      res.json({
        orders: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  }
}

module.exports = new OrderController();
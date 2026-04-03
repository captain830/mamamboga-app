const { pool } = require('../config/database');
const { createNotification } = require('../utils/notification.service');

class DeliveryController {
  // Assign delivery (admin)
  async assignDelivery(req, res) {
    const { order_id, driver_id, driver_name, driver_phone, estimated_arrival } = req.body;

    try {
      // Check if order exists
      const orderResult = await pool.query(
        'SELECT status, delivery_type, user_id, order_number FROM orders WHERE id = $1',
        [order_id]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const order = orderResult.rows[0];
      
      if (order.delivery_type !== 'delivery') {
        return res.status(400).json({ message: 'This order is for pickup only' });
      }
      
      if (order.status !== 'processing' && order.status !== 'confirmed') {
        return res.status(400).json({ message: 'Order not ready for delivery assignment' });
      }

      // Check if delivery already exists
      const existingDelivery = await pool.query(
        'SELECT id FROM deliveries WHERE order_id = $1',
        [order_id]
      );
      
      let result;
      
      if (existingDelivery.rows.length > 0) {
        // Update existing delivery
        result = await pool.query(
          `UPDATE deliveries 
           SET driver_id = COALESCE($1, driver_id),
               driver_name = COALESCE($2, driver_name),
               driver_phone = COALESCE($3, driver_phone),
               estimated_arrival = COALESCE($4, estimated_arrival),
               status = 'assigned',
               updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $5
           RETURNING *`,
          [driver_id || null, driver_name || null, driver_phone || null, estimated_arrival || null, order_id]
        );
      } else {
        // Create new delivery
        result = await pool.query(
          `INSERT INTO deliveries (order_id, driver_id, driver_name, driver_phone, estimated_arrival, status)
           VALUES ($1, $2, $3, $4, $5, 'assigned')
           RETURNING *`,
          [order_id, driver_id || null, driver_name || null, driver_phone || null, estimated_arrival || null]
        );
      }
      
      // Update order status
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['shipped', order_id]
      );
      
      // Create notification for customer
      await createNotification({
        userId: order.user_id,
        title: 'Order Shipped',
        message: `Your order #${order.order_number} has been assigned for delivery`,
        type: 'info',
        metadata: { order_id }
      });
      
      res.json({
        success: true,
        message: 'Delivery assigned successfully',
        delivery: result.rows[0],
      });
    } catch (error) {
      console.error('Assign delivery error:', error);
      res.status(500).json({ message: 'Failed to assign delivery' });
    }
  }

  // Track delivery
  async trackDelivery(req, res) {
    try {
      const result = await pool.query(
        `SELECT d.*, o.status as order_status, o.delivery_address, o.delivery_instructions
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         WHERE d.order_id = $1 AND (o.user_id = $2 OR $3 = 'admin' OR $3 = 'driver')
         ORDER BY d.created_at DESC
         LIMIT 1`,
        [req.params.orderId, req.user.id, req.user.role]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Track delivery error:', error);
      res.status(500).json({ message: 'Failed to track delivery' });
    }
  }

  // Update delivery status (driver/admin)
  async updateDeliveryStatus(req, res) {
    const { status, current_location } = req.body;

    try {
      const result = await pool.query(
        `UPDATE deliveries 
         SET status = $1, 
             current_location = COALESCE($2, current_location),
             actual_delivery = CASE WHEN $1 = 'delivered' THEN CURRENT_TIMESTAMP ELSE actual_delivery END,
             tracking_history = tracking_history || $3::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [status, current_location || null, JSON.stringify({ status, location: current_location, timestamp: new Date() }), req.params.deliveryId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      
      const delivery = result.rows[0];
      
      // Get order details for notification
      const orderResult = await pool.query(
        'SELECT user_id, order_number FROM orders WHERE id = $1',
        [delivery.order_id]
      );
      
      // Update order status if delivered
      if (status === 'delivered') {
        await pool.query(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['delivered', delivery.order_id]
        );
        
        // Create notification
        await createNotification({
          userId: orderResult.rows[0].user_id,
          title: 'Order Delivered',
          message: `Your order #${orderResult.rows[0].order_number} has been delivered`,
          type: 'success',
          metadata: { order_id: delivery.order_id }
        });
      } else if (status === 'picked_up') {
        await createNotification({
          userId: orderResult.rows[0].user_id,
          title: 'Order Picked Up',
          message: `Your order #${orderResult.rows[0].order_number} has been picked up by the driver`,
          type: 'info',
          metadata: { order_id: delivery.order_id }
        });
      } else if (status === 'in_transit') {
        await createNotification({
          userId: orderResult.rows[0].user_id,
          title: 'Order In Transit',
          message: `Your order #${orderResult.rows[0].order_number} is on the way`,
          type: 'info',
          metadata: { order_id: delivery.order_id }
        });
      }
      
      res.json({
        success: true,
        message: 'Delivery status updated',
        delivery,
      });
    } catch (error) {
      console.error('Update delivery status error:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  }

  // Get driver's deliveries
  async getMyDeliveries(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT d.*, o.order_number, o.delivery_address, o.delivery_instructions, 
               u.name as customer_name, u.phone as customer_phone
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN users u ON o.user_id = u.id
        WHERE d.driver_id = $1
      `;
      const params = [req.user.id];
      let paramIndex = 2;

      if (status) {
        query += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      res.json({
        deliveries: result.rows,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      console.error('Get driver deliveries error:', error);
      res.status(500).json({ message: 'Failed to fetch deliveries' });
    }
  }

  // Get all deliveries (admin)
  async getAllDeliveries(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let query = `
        SELECT d.*, o.order_number, o.delivery_address, u.name as customer_name
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      res.json({
        deliveries: result.rows,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      console.error('Get all deliveries error:', error);
      res.status(500).json({ message: 'Failed to fetch deliveries' });
    }
  }
}

module.exports = new DeliveryController();
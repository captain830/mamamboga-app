const axios = require('axios');
const { pool } = require('../config/database');
const { createNotification } = require('../utils/notification.service');

class PaymentController {
  // Generate M-Pesa access token
  async getAccessToken() {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const url = process.env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa token error:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Initiate STK Push
  async initiateSTKPush(req, res) {
    const { orderId, phone } = req.body;

    try {
      // Get order details
      const orderResult = await pool.query(
        'SELECT total_amount, order_number FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, req.user.id]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const order = orderResult.rows[0];
      const amount = Math.round(order.total_amount);
      const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

      const stkUrl = process.env.MPESA_ENVIRONMENT === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

      const response = await axios.post(stkUrl, {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `ORDER-${order.order_number}`,
        TransactionDesc: 'Mama Mboga Payment'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Save payment record
      await pool.query(
        `INSERT INTO payments (order_id, amount, status, checkout_request_id, merchant_request_id, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, amount, 'pending', response.data.CheckoutRequestID, response.data.MerchantRequestID, 'mpesa']
      );

      res.json({
        message: 'Payment initiated',
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID
      });
    } catch (error) {
      console.error('STK Push error:', error.response?.data || error.message);
      res.status(500).json({ 
        message: 'Failed to initiate payment',
        error: error.response?.data?.errorMessage || error.message 
      });
    }
  }

  // M-Pesa Callback Handler
  async handleCallback(req, res) {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
    
    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID, CallbackMetadata } = stkCallback;

    try {
      if (ResultCode === 0 && CallbackMetadata) {
        // Payment successful
        const mpesaCode = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const amount = CallbackMetadata.Item.find(item => item.Name === 'Amount')?.Value;
        
        // Find payment record
        const paymentResult = await pool.query(
          'SELECT order_id FROM payments WHERE checkout_request_id = $1',
          [CheckoutRequestID]
        );
        
        if (paymentResult.rows.length > 0) {
          const { order_id } = paymentResult.rows[0];
          
          // Update payment
          await pool.query(
            `UPDATE payments 
             SET status = 'completed', 
                 mpesa_code = $1, 
                 transaction_date = CURRENT_TIMESTAMP,
                 result_code = $2,
                 result_desc = $3
             WHERE checkout_request_id = $4`,
            [mpesaCode, ResultCode, ResultDesc, CheckoutRequestID]
          );
          
          // Update order payment status
          await pool.query(
            'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['paid', order_id]
          );
          
          // Create notification
          const orderResult = await pool.query(
            'SELECT order_number, user_id FROM orders WHERE id = $1',
            [order_id]
          );
          
          await createNotification({
            userId: orderResult.rows[0].user_id,
            title: 'Payment Received',
            message: `Payment of KSh ${amount} for order #${orderResult.rows[0].order_number} was successful`,
            type: 'success',
            metadata: { order_id, mpesa_code: mpesaCode }
          });
        }
      } else {
        // Payment failed
        await pool.query(
          `UPDATE payments 
           SET status = 'failed', 
               result_code = $1, 
               result_desc = $2
           WHERE checkout_request_id = $3`,
          [ResultCode, ResultDesc, CheckoutRequestID]
        );
        
        const paymentResult = await pool.query(
          'SELECT order_id FROM payments WHERE checkout_request_id = $1',
          [CheckoutRequestID]
        );
        
        if (paymentResult.rows.length > 0) {
          await pool.query(
            'UPDATE orders SET payment_status = $1 WHERE id = $2',
            ['failed', paymentResult.rows[0].order_id]
          );
        }
      }
      
      res.json({ message: 'Callback processed successfully' });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ message: 'Failed to process callback' });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    const { orderId } = req.params;

    try {
      const result = await pool.query(
        `SELECT p.*, o.total_amount, o.order_number
         FROM payments p
         JOIN orders o ON p.order_id = o.id
         WHERE p.order_id = $1 AND (o.user_id = $2 OR $3 = 'admin')
         ORDER BY p.transaction_date DESC
         LIMIT 1`,
        [orderId, req.user.id, req.user.role]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({ message: 'Failed to fetch payment status' });
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const result = await pool.query(
        `SELECT p.*, o.order_number, o.total_amount as order_total
         FROM payments p
         JOIN orders o ON p.order_id = o.id
         WHERE o.user_id = $1
         ORDER BY p.transaction_date DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
      
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.user_id = $1',
        [req.user.id]
      );
      
      res.json({
        payments: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ message: 'Failed to fetch payment history' });
    }
  }
}

module.exports = new PaymentController();
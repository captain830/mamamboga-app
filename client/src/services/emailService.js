const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS && 
         process.env.EMAIL_USER !== 'your-email@gmail.com';
};

// Create transporter only if configured
let transporter = null;
if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('✅ Email service configured');
} else {
  console.log('⚠️ Email service not configured - emails will be logged only');
}

// Send order confirmation email
const sendOrderConfirmationEmail = async (order, user) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2e7d32;">🥬 Mama Mboga</h1>
        <h2>Order Confirmation</h2>
      </div>
      
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Thank you for your order! Here are your order details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Order #${order.order_number}</h3>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p><strong>Delivery Type:</strong> ${order.delivery_type}</p>
        ${order.delivery_address ? `<p><strong>Delivery Address:</strong> ${order.delivery_address}</p>` : ''}
      </div>
      
      <h3>Order Items:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background-color: #2e7d32; color: white;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: right;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">${item.product_name}</td>
              <td style="padding: 10px; text-align: right;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right;">KSh ${item.price}</td>
              <td style="padding: 10px; text-align: right;">KSh ${item.price * item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px; text-align: right;">KSh ${order.subtotal}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td>
            <td style="padding: 10px; text-align: right;">KSh ${order.delivery_fee}</td>
          </tr>
          <tr style="background-color: #e8f5e9;">
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 10px; text-align: right;"><strong>KSh ${order.total_amount}</strong></td>
          </tr>
        </tfoot>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e9; border-radius: 8px; text-align: center;">
        <p>You can track your order status in your account dashboard.</p>
        <p>Thank you for choosing Mama Mboga!</p>
      </div>
      
      <hr style="margin: 30px 0;" />
      <p style="color: #666; font-size: 12px; text-align: center;">
        © 2024 Mama Mboga. All rights reserved.<br/>
        Fresh produce delivered to your doorstep.
      </p>
    </div>
  `;

  // If email is configured, send real email
  if (transporter && isEmailConfigured()) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Confirmation #${order.order_number}`,
      html: emailHtml
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } else {
    // Log email for development
    console.log('\n📧 EMAIL WOULD BE SENT:');
    console.log(`   To: ${user.email}`);
    console.log(`   Subject: Order Confirmation #${order.order_number}`);
    console.log(`   Body: ${emailHtml.substring(0, 200)}...\n`);
    return false;
  }
};

// Send order status update email
const sendOrderStatusEmail = async (order, user, status) => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being prepared.',
    processing: 'Your order is being processed and packed.',
    shipped: 'Great news! Your order has been shipped and is on its way!',
    delivered: 'Your order has been delivered. Enjoy your fresh produce!',
    cancelled: 'Your order has been cancelled.'
  };
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">Mama Mboga</h1>
      <h2>Order Status Update</h2>
      
      <p>Dear <strong>${user.name}</strong>,</p>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Order #${order.order_number}</strong> is now <strong style="color: #2e7d32;">${status.toUpperCase()}</strong></p>
        <p>${statusMessages[status] || `Your order status has been updated to ${status}.`}</p>
      </div>
      
      <p>You can view your order details in your account dashboard.</p>
      
      <div style="margin-top: 30px; text-align: center;">
        <a href="http://localhost:5173/orders/${order.id}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Order Details
        </a>
      </div>
    </div>
  `;

  if (transporter && isEmailConfigured()) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Status Update #${order.order_number} - ${status.toUpperCase()}`,
      html: emailHtml
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } else {
    console.log(`\n📧 STATUS EMAIL WOULD BE SENT: ${order.order_number} -> ${status}\n`);
    return false;
  }
};

module.exports = { 
  sendOrderConfirmationEmail, 
  sendOrderStatusEmail 
};
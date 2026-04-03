const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const templates = {
  'email-verification': (data) => ({
    subject: 'Verify Your Email - Mama Mboga',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Welcome to Mama Mboga!</h2>
        <p>Hi ${data.name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email/${data.token}" 
           style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy this link: ${process.env.FRONTEND_URL}/verify-email/${data.token}</p>
        <p>This link expires in 24 hours.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Mama Mboga - Fresh Produce Delivered to Your Doorstep</p>
      </div>
    `
  }),
  
  'password-reset': (data) => ({
    subject: 'Password Reset Request - Mama Mboga',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Password Reset Request</h2>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${data.token}" 
           style="display: inline-block; padding: 10px 20px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy this link: ${process.env.FRONTEND_URL}/reset-password/${data.token}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Mama Mboga - Fresh Produce Delivered to Your Doorstep</p>
      </div>
    `
  }),
  
  'order-confirmation': (data) => ({
    subject: `Order Confirmation #${data.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order #${data.order_number}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: right;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">KSh ${item.price}</td>
                <td style="padding: 10px; text-align: right;">KSh ${item.quantity * item.price}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td><td style="padding: 10px; text-align: right;">KSh ${data.subtotal}</td></tr>
            <tr><td colspan="3" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td><td style="padding: 10px; text-align: right;">KSh ${data.delivery_fee}</td></tr>
            <tr><td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax (16%):</strong></td><td style="padding: 10px; text-align: right;">KSh ${data.tax}</td></tr>
            <tr style="background-color: #f5f5f5;"><td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td><td style="padding: 10px; text-align: right;"><strong>KSh ${data.total}</strong></td></tr>
          </tfoot>
        </table>
        <p><strong>Delivery Type:</strong> ${data.delivery_type === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</p>
        ${data.delivery_address ? `<p><strong>Delivery Address:</strong> ${data.delivery_address}</p>` : ''}
        <p>We'll notify you when your order is ready!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Mama Mboga - Fresh Produce Delivered to Your Doorstep</p>
      </div>
    `
  })
};

// Send email function
async function sendEmail({ to, subject, template, data }) {
  try {
    const templateData = templates[template](data);
    
    const mailOptions = {
      from: `"Mama Mboga" <${process.env.EMAIL_USER}>`,
      to,
      subject: templateData.subject || subject,
      html: templateData.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error - email failure shouldn't break the app
    return null;
  }
}

module.exports = { sendEmail };
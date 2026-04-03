const nodemailer = require('nodemailer');

// Force email configuration check
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 Email Config Check:');
console.log('   EMAIL_USER:', EMAIL_USER);
console.log('   EMAIL_PASS length:', EMAIL_PASS ? EMAIL_PASS.length : 0);

// Create transporter if credentials exist
let transporter = null;
let emailEnabled = false;

if (EMAIL_USER && EMAIL_PASS && EMAIL_USER !== 'your-email@gmail.com') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
  emailEnabled = true;
  console.log('✅ Email service ENABLED - Real emails will be sent!');
} else {
  console.log('⚠️ Email service DISABLED - Emails will be logged only');
}

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center;">
        <h1 style="color: #2e7d32;">🥬 Welcome to Mama Mboga!</h1>
      </div>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Thank you for joining Mama Mboga! We're excited to have you.</p>
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>🎉 Get Started:</h3>
        <ul>
          <li>🛒 Browse fresh produce</li>
          <li>🚚 Get delivery to your doorstep</li>
          <li>💰 Pay with M-Pesa</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="http://localhost:5173/products" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Start Shopping</a>
      </div>
      <hr />
      <p style="color: #666; font-size: 12px; text-align: center;">Mama Mboga - Fresh produce delivered to your doorstep</p>
    </div>
  `;

  if (emailEnabled && transporter) {
    try {
      await transporter.sendMail({
        from: `"Mama Mboga" <${EMAIL_USER}>`,
        to: user.email,
        subject: `🎉 Welcome to Mama Mboga, ${user.name}!`,
        html: emailHtml
      });
      console.log(`✅ Welcome email SENT to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email:`, error.message);
      return false;
    }
  } else {
    console.log(`📧 [DEV MODE] Welcome email would be sent to: ${user.email}`);
    return false;
  }
};

// Send login notification email
const sendLoginNotificationEmail = async (user, req) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">🔐 New Login Detected</h1>
      <p>Dear <strong>${user.name}</strong>,</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>🖥️ Device:</strong> ${req.headers['user-agent'] || 'Unknown'}</p>
      </div>
      <p>If this wasn't you, please reset your password immediately.</p>
      <div style="text-align: center;">
        <a href="http://localhost:5173/profile" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Account</a>
      </div>
    </div>
  `;

  if (emailEnabled && transporter) {
    try {
      await transporter.sendMail({
        from: `"Mama Mboga" <${EMAIL_USER}>`,
        to: user.email,
        subject: `🔐 New Login to Your Mama Mboga Account`,
        html: emailHtml
      });
      console.log(`✅ Login notification SENT to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send login email:`, error.message);
      return false;
    }
  } else {
    console.log(`📧 [DEV MODE] Login notification would be sent to: ${user.email}`);
    return false;
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order, user) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">✅ Order Confirmed!</h1>
      <p>Dear <strong>${user.name}</strong>,</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Order #${order.order_number}</h3>
        <p><strong>Total:</strong> KSh ${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
      <div style="text-align: center;">
        <a href="http://localhost:5173/orders/${order.id}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a>
      </div>
    </div>
  `;

  if (emailEnabled && transporter) {
    try {
      await transporter.sendMail({
        from: `"Mama Mboga" <${EMAIL_USER}>`,
        to: user.email,
        subject: `Order Confirmation #${order.order_number}`,
        html: emailHtml
      });
      console.log(`✅ Order confirmation SENT to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send order email:`, error.message);
      return false;
    }
  } else {
    console.log(`📧 [DEV MODE] Order confirmation would be sent to: ${user.email}`);
    return false;
  }
};

// Send order status update email
const sendOrderStatusEmail = async (order, user, status) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">📦 Order Status Update</h1>
      <p>Dear <strong>${user.name}</strong>,</p>
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Order #${order.order_number}</strong> is now <strong>${status.toUpperCase()}</strong></p>
      </div>
      <div style="text-align: center;">
        <a href="http://localhost:5173/orders/${order.id}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
      </div>
    </div>
  `;

  if (emailEnabled && transporter) {
    try {
      await transporter.sendMail({
        from: `"Mama Mboga" <${EMAIL_USER}>`,
        to: user.email,
        subject: `Order ${status.toUpperCase()}: #${order.order_number}`,
        html: emailHtml
      });
      console.log(`✅ Status update SENT to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send status email:`, error.message);
      return false;
    }
  } else {
    console.log(`📧 [DEV MODE] Status update would be sent to: ${user.email}`);
    return false;
  }
};

module.exports = { 
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail
};
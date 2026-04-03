const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Testing email configuration...');
console.log('Email user:', process.env.EMAIL_USER);
console.log('Email pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error.message);
  } else {
    console.log('✅ Email configured successfully!');
    
    // Send a test email
    transporter.sendMail({
      from: `"Mama Mboga" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ Mama Mboga Email Test',
      text: 'Your email system is working perfectly!',
      html: '<h1>✅ Success!</h1><p>Your Mama Mboga email system is working perfectly.</p>'
    }, (err, info) => {
      if (err) {
        console.log('❌ Test email failed:', err.message);
      } else {
        console.log('✅ Test email sent! Check your inbox at:', process.env.EMAIL_USER);
        console.log('Message ID:', info.messageId);
      }
    });
  }
});
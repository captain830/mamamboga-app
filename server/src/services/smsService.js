const africastalking = require('africastalking');

// Initialize Africa's Talking
const africasTalking = africastalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
});

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map();

// Send verification SMS
const sendVerificationSMS = async (phone, code) => {
  const message = `
🥬 *MAMA MBOGA VERIFICATION* 🥬

Your verification code is: *${code}*

Valid for: 10 minutes
Enter this code to complete your registration.

⚠️ Never share this code with anyone.

Thank you for choosing Mama Mboga! 🛒
  `.trim();

  try {
    const result = await africasTalking.SMS.send({
      to: phone,
      message: message,
      from: process.env.SMS_SENDER_ID || 'MamaMboga'
    });
    console.log(`✅ SMS sent to ${phone}`);
    return result;
  } catch (error) {
    console.error('SMS error:', error);
    throw error;
  }
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification code
const storeVerificationCode = (phone, code) => {
  verificationCodes.set(phone, {
    code: code,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
  
  // Auto cleanup after 10 minutes
  setTimeout(() => {
    if (verificationCodes.get(phone)?.code === code) {
      verificationCodes.delete(phone);
    }
  }, 10 * 60 * 1000);
};

// Verify code
const verifyCode = (phone, code) => {
  const record = verificationCodes.get(phone);
  if (!record) return false;
  if (record.expiresAt < Date.now()) return false;
  return record.code === code;
};

// Remove used code
const removeVerificationCode = (phone) => {
  verificationCodes.delete(phone);
};

module.exports = {
  sendVerificationSMS,
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  removeVerificationCode
};
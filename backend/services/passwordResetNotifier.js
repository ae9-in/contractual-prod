const env = require('../config/env');
const nodemailer = require('nodemailer');

let transport;

function getTransport() {
  if (transport) return transport;
  if (!env.mail.host || !env.mail.user || !env.mail.pass || !env.mail.from) {
    return null;
  }
  transport = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });
  return transport;
}

async function sendPasswordResetOtp({ email, otp }) {
  const smtp = getTransport();
  if (smtp) {
    await smtp.sendMail({
      from: env.mail.from,
      to: email,
      subject: 'Your password reset code',
      text: `Your Contractual password reset OTP is ${otp}. It expires in 15 minutes.`,
    });
    return;
  }
  throw new Error('Password reset email service is not configured');
}

module.exports = {
  sendPasswordResetOtp,
};

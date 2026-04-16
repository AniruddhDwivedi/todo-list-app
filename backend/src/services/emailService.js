import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your @vitapstudent.ac.in address
    pass: process.env.EMAIL_PASS, // the 16-character app password (no spaces)
  },
});

export const sendOTP = async (email, code) => {
  const mailOptions = {
    from: `"Todo App Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${code} is your verification code`,
    text: `Your one-time MFA code is: ${code}. This code expires in 10 minutes.`,
  };
  return transporter.sendMail(mailOptions);
};
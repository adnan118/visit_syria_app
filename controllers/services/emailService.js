const nodemailer = require("nodemailer");

// ✅ Email Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * 📌 Send OTP Email
 */
async function sendEmail(email, otp, subject, name = "Dear User") {
  const mailOptions = {
    from: `Visit Syria`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
        <div style="background: #3674B5; color: #fff; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="margin: 0;">🔐 ${subject}</h2>
        </div>
        <div style="padding: 20px; background: #fff; border: 1px solid #eee; border-top: none;">
          <p style="font-size: 16px; color: #333;">Hello <b>${name}</b>,</p>
          <p style="font-size: 15px; color: #555;">Here is your verification code:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background: #D0B502; color: #000; font-size: 22px; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #777;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      message: "Password reset OTP sent to your email",
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
}

/**
 * 📌 Send New Login Alert
 */
async function sendEmailNewLogin(email, subject, name = "Dear User") {
  const mailOptions = {
    from: `Visit Syria`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 12px;">
        <div style="background: #3674B5; color: #fff; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="margin: 0;">🔔 Security Alert</h2>
        </div>
        <div style="padding: 20px; background: #fff; border: 1px solid #eee; border-top: none;">
          <p style="font-size: 16px; color: #333;">Hello <b>${name}</b>,</p>
          <p style="font-size: 15px; color: #555;">We noticed a new login to your account.</p>
          <p style="font-size: 13px; color: #777;">If this was you, no further action is required. If not, please reset your password immediately.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="#" style="background: #D0B502; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { message: "Login alert sent to your email", statusCode: 200 };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
}

module.exports = { sendEmail, sendEmailNewLogin };

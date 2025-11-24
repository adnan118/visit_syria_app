// controllers/services/smsService.js
const twilio = require("twilio");

// مفاتيح Twilio من متغيرات البيئة
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE;

const client = twilio(accountSid, authToken);

exports.sendSms = async function (to, message) {
  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to.startsWith("+") ? to : `+${to}`, // تأكد من وجود كود الدولة
    });
    console.log("SMS sent:", response.sid);
    return response;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

require("dotenv").config();
const twilio = require("twilio");
const nodemailer = require("nodemailer");


const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL, 
    pass: process.env.SMTP_PASSWORD, 
  },
});

/**
 * Function to send a message via WhatsApp and Email
 * @param {string} phone - Recipient's phone number (E.164 format)
 * @param {string} message - The message to be sent
 * @param {string} email - Recipient's email address
 * @returns {Object} Response with success status and details
 */
const sendMessage = async (phone, message, email) => {
  try {
    if (!phone || !message || !email) {
      throw new Error("Phone number, message, and email are required");
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    // Send WhatsApp Message
    const whatsappResponse = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      body: message,
    });

    console.log("WhatsApp Message SID:", whatsappResponse.sid);

    // Send Email
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "New Message Notification",
      text: message,
    };

    const emailResponse = await transporter.sendMail(mailOptions);
    console.log("Email Sent:", emailResponse.messageId);

    return {
      success: true,
      message: "Message sent successfully via WhatsApp and Email",
      data: {
        whatsappSID: whatsappResponse.sid,
        emailMessageId: emailResponse.messageId,
      },
    };
  } catch (error) {
    console.error("Error sending message:", error.message);
    return { success: false, message: error.message };
  }
};

module.exports = sendMessage;

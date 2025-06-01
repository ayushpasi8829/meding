require("dotenv").config();
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const Notification = require('../models/Notification'); 

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
const sendMessage = async (phone, message, email, userId = null) => {
  let status = 'sent';
  let error = null;
  let whatsappSID = null;
  let emailMessageId = null;

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
    whatsappSID = whatsappResponse.sid;
    console.log("WhatsApp Message SID:", whatsappSID);

    // Send Email
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "New Message Notification",
      text: message,
    };

    const emailResponse = await transporter.sendMail(mailOptions);
    emailMessageId = emailResponse.messageId;
    console.log("Email Sent:", emailMessageId);
  } catch (err) {
    status = 'failed';
    error = err.message || 'Unknown error';
    console.error("Error sending message:", error);
  }

  // Log notification
  try {
    await Notification.create({
      user: userId,
      type: 'both',
      recipient: `${phone} / ${email}`,
      message,
      status,
      error,
      sentAt: new Date(),
    });
  } catch (logErr) {
    console.error("Failed to log notification:", logErr.message);
  }

  return {
    success: status === 'sent',
    message: status === 'sent'
      ? "Message sent successfully via WhatsApp and Email"
      : "Failed to send message",
    data: {
      whatsappSID,
      emailMessageId,
      status,
      error,
    },
  };
};

module.exports = sendMessage;

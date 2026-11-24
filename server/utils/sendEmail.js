
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Check Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials are missing in environment variables");
    }

    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"ZenHR" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", to);
    console.log("Message ID:", info.messageId);

    return info;

  } catch (error) {
    console.error("Gmail Email Error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;

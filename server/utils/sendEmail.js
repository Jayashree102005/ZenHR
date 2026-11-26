
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Check Mailjet SMTP credentials
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      MAIL_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
      throw new Error("Mailjet SMTP environment variables are missing");
    }

    // Mailjet SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
      requireTLS: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"ZenHR" <${MAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log("Mailjet email sent successfully:", to);
    console.log("Message ID:", info.messageId);

    return info;

  } catch (error) {
    console.error("Mailjet Email Error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;

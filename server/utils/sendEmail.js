
const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: process.env.GOOGLE_SCRIPT_SECRET,
        to,
        subject,
        html,
      }),
      redirect: "follow",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Google email service failed"
      );
    }

    console.log("Email sent successfully:", to);

    return result;
  } catch (error) {
    console.error("Google Apps Script Email Error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;

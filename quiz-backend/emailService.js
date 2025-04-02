require("dotenv").config();
const axios = require("axios");
console.log("🔑 BREVO_API_KEY:", process.env.BREVO_API_KEY ? "Loaded" : "NOT FOUND");
console.log("📩 EMAIL_USER:", process.env.EMAIL_USER || "NOT FOUND");

const sendEmail = async (to, subject, htmlContent) => {
    console.log("🔥 sendEmail function is running!");
    console.log("📤 Sending email to:", to);

    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: "Quiz System", email: process.env.EMAIL_USER },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Email API Response:", response.status, response.data);
    } catch (error) {
        console.error("❌ Error sending email:", error.response ? error.response.data : error.message);
    }
};

module.exports = sendEmail;

const axios = require("axios");
require("dotenv").config();

const sendEmail = async (to, subject, htmlContent) => {
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

        console.log("Email sent successfully:", response.data);
    } catch (error) {
        console.error("Error sending email:", error.response ? error.response.data : error.message);
    }
};

module.exports = sendEmail;

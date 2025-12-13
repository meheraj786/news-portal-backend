import nodemailer from "nodemailer";
import { verificationEmailTemplate } from "../templates/verificationEmail";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM_ADDRESS,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Type for Email Templates
type EmailTemplate = "verification" | "passwordReset"; // Extend with more templates as needed

// Function to get the correct email subject based on template type
const getEmailSubject = (template: EmailTemplate) => {
  switch (template) {
    case "verification":
      return "Verification Email from " + process.env.APP_NAME;
    case "passwordReset":
      return "Password Reset Request";
    default:
      throw new Error("No email subject found for this type.");
  }
};

// Function to get the correct email template
const getEmailTemplate = (type: EmailTemplate, data: string) => {
  switch (type) {
    case "verification":
      return verificationEmailTemplate(data);
    default:
      throw new Error("No email template found for this type.");
  }
};

// Global Email Sending Function
export async function sendEmail(to: string, type: EmailTemplate, data: string) {
  try {
    const subject = getEmailSubject(type);
    const emailHtml = getEmailTemplate(type, data);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS,
      to: to,
      subject: subject,
      html: emailHtml,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Failed to send email. Please try again later.");
  }
}

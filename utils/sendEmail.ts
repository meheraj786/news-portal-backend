import nodemailer from "nodemailer";
import { verificationEmailTemplate } from "../templates/verificationEmail";

// FIX: Switch to Port 587 (STARTTLS) to bypass Cloud Firewall blocks
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_FROM_ADDRESS,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // ADD THESE TWO LINES 👇
  logger: true,
  debug: true,
});

// Type for Email Templates
type EmailTemplate = "verification" | "passwordReset";

// Function to get the correct email subject
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
    console.log(`Email sent successfully to ${to}`);
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Failed to send email. Please try again later.");
  }
}

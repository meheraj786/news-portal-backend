import { Resend } from "resend";
import { verificationEmailTemplate } from "../templates/verificationEmail";

// 1. Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplate = "verification" | "passwordReset";

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

const getEmailTemplate = (type: EmailTemplate, data: string) => {
  switch (type) {
    case "verification":
      return verificationEmailTemplate(data);
    default:
      throw new Error("No email template found for this type.");
  }
};

export async function sendEmail(to: string, type: EmailTemplate, data: string) {
  try {
    const subject = getEmailSubject(type);
    const emailHtml = getEmailTemplate(type, data);

    const response = await resend.emails.send({
      from: "noreply@protidinjonotarnews.com",
      to: to,
      subject: subject,
      html: emailHtml,
    });

    if (response.error) {
      console.error("Resend API Error:", response.error);
      throw new Error("Failed to send email via Resend.");
    }

    console.log(`Email sent successfully to ${to} (ID: ${response.data?.id})`);
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Failed to send email. Please try again later.");
  }
}

import EmailClient from "./email-client";

export default function EmailPage() {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS_SET: !!process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_NAME: process.env.FROM_NAME,
  };

  return <EmailClient config={config} />;
}

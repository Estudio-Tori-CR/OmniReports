import nodemailer from "nodemailer";

type SendMailArgs = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

class Mail {
  async SendMail({ to, subject, text, html }: SendMailArgs) {
    try {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.FROM_EMAIL ?? user;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: { user, pass },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS === "true",
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      throw error;
    }
  }
}

export default Mail;
export type { SendMailArgs };

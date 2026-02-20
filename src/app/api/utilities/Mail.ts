import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

type TemplateData = Record<string, string | number | undefined>;

type SendMailArgs = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
    encoding?: string;
  }>;
  templateName?: string; // load template from templates folder by name (without .html)
  templateData?: TemplateData; // placeholders replacement for template
};

class Mail {
  private transporter: ReturnType<typeof nodemailer.createTransport> | null =
    null;

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL ?? user;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS === "true",
      },
    });

    // attach defaultFrom for convenience
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.transporter as any).defaultFrom = from;

    return this.transporter;
  }

  private async loadTemplate(name: string) {
    // Allow overriding templates location (useful for prod builds)
    const basePath = process.env.EMAIL_TEMPLATES_PATH
      ? path.resolve(process.env.EMAIL_TEMPLATES_PATH)
      : path.join(process.cwd(), "src", "app", "api", "utilities", "templates");

    const filePath = path.join(basePath, `${name}.html`);
    try {
      const content = await fs.readFile(filePath, { encoding: "utf8" });
      return content;
    } catch (err) {
      throw new Error(`Email template not found: ${filePath}`);
    }
  }

  private applyTemplate(template: string, data?: TemplateData) {
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
      const lookup =
        data && Object.prototype.hasOwnProperty.call(data, key)
          ? data![key]
          : (process.env[key] ?? "");
      return lookup === undefined || lookup === null ? "" : String(lookup);
    });
  }

  async SendMail({
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments,
    templateName,
    templateData,
  }: SendMailArgs) {
    try {
      const transporter = this.getTransporter();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const from = (transporter as any).defaultFrom;

      let finalHtml = html;
      if (!finalHtml && templateName) {
        const tpl = await this.loadTemplate(templateName);
        finalHtml = this.applyTemplate(tpl, {
          ...templateData,
          YEAR: new Date().getFullYear(),
        });
      }

      const info = await transporter.sendMail({
        from,
        to,
        cc,
        bcc,
        subject,
        text,
        html: finalHtml,
        attachments,
      });

      return info;
    } catch (error) {
      throw error;
    }
  }
}

export default Mail;
export type { SendMailArgs };

import { betterAuth } from "better-auth";
import { db } from "./db.ts";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (user.email === process.env.DEMO_EMAIL) return;
      if (process.env.SMTP_HOST) {
        await nodemailer
          .createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
              : undefined,
          })
          .sendMail({
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: "Đặt lại mật khẩu SkillMAP",
            text: `Bạn đã yêu cầu đặt lại mật khẩu SkillMAP. Mở liên kết để chọn mật khẩu mới:\n${url}\nNếu không phải bạn, hãy bỏ qua email này.`,
          });
      } else if (process.env.AUTH_EMAIL_MODE === "local") {
        await mkdir(".data/mail-outbox", { recursive: true });
        await writeFile(
          `.data/mail-outbox/${randomUUID()}.json`,
          JSON.stringify(
            { to: user.email, url, subject: "Đặt lại mật khẩu SkillMAP" },
            null,
            2,
          ),
          { mode: 0o600 },
        );
      } else throw new Error("SMTP is not configured");
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 6 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  advanced: {
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith(
      "https://",
    ),
  },
});

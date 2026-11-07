import nodemailer from "nodemailer";
import type { T } from "@/lib/i18n";

/**
 * Sends the sign-in code through Gmail SMTP (same EMAIL_SENDER / EMAIL_PASSWORD setup as gov24).
 * Returns the code when no SMTP is configured in development, so the login screen can show it.
 */
export async function sendCodeMail(to: string, code: string, t: T): Promise<string | null> {
  const user = process.env.EMAIL_SENDER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") throw new Error("EMAIL_SENDER / EMAIL_PASSWORD are not configured");
    console.log(`[boundless] sign-in code for ${to}: ${code}`);
    return code;
  }
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  await transport.sendMail({
    from: `Boundless <${user}>`,
    to,
    subject: t("Boundless 로그인 코드: {code}", { code }),
    text: t("로그인 코드는 {code} 입니다. 10분 동안 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.", { code }),
  });
  return null;
}

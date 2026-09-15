/** Transactional email. Only password reset for now (spec has no other email). */
import "server-only";
import { Resend } from "resend";

import { env } from "@/lib/env";

type Mail = { to: string; subject: string; text: string };

/**
 * Without a key, the message goes to the server log instead of the inbox. Local
 * development then still has a working reset flow, and a misconfigured
 * deployment fails loudly in the log rather than silently swallowing the link.
 */
export async function sendMail({ to, subject, text }: Mail) {
  const { RESEND_API_KEY, EMAIL_FROM } = env();

  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY is not set. Would have sent to ${to}:\n${text}`);
    return;
  }

  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });

  if (error) {
    console.error("sendMail failed", error);
    throw new Error(error.message);
  }
}

export function passwordResetMail(url: string): Omit<Mail, "to"> {
  return {
    subject: "Reset your Compose password",
    text: [
      "Someone asked to reset the password on your Compose account.",
      "",
      `Open this link to choose a new one: ${url}`,
      "",
      "The link works once and expires in an hour. If this was not you, nothing has changed and you can ignore this email.",
    ].join("\n"),
  };
}

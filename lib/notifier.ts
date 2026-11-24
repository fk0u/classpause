import { env } from "./env";

/**
 * Lecturer prompt delivery. Telegram Bot API when TELEGRAM_BOT_TOKEN is set and the
 * lecturer has a chat id; otherwise the link is only logged (and shown in demo mode).
 * WhatsApp Business can be added as a second adapter with the same signature.
 */
export async function sendLecturerPrompt(opts: { chatId?: string | null; text: string; url: string }) {
  if (!env.TELEGRAM_BOT_TOKEN || !opts.chatId) {
    console.info(`[notifier] prompt (no channel configured): ${opts.url}`);
    return { delivered: false as const };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: opts.chatId,
        text: opts.text,
        reply_markup: { inline_keyboard: [[{ text: "Open 1-tap card", url: opts.url }]] },
      }),
      signal: AbortSignal.timeout(5000),
    });
    return { delivered: res.ok as boolean };
  } catch (e) {
    // Never let a messaging outage block the protocol: the SLA timer still runs.
    console.error("[notifier] telegram failed", e);
    return { delivered: false as const };
  }
}

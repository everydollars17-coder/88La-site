import crypto from "node:crypto";
import { getDocument, listCollection, requireAdmin, setDocument } from "./_security.js";

const SITE = "https://site.88lamoney.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOKEN_RE = /^[a-f0-9]{48}$/;
const CAMPAIGN_RE = /^[A-Za-z0-9_-]{8,80}$/;

const escapeHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const renderBody = value => escapeHtml(value)
  .split(/\n{2,}/)
  .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.8">${paragraph.replaceAll("\n", "<br>")}</p>`)
  .join("");

const chunksOf = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const unsubscribeUrl = token => `${SITE}/api/newsletter?action=unsubscribe&token=${token}`;

function unsubscribeSuccessPage() {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>已完成退訂｜88La</title></head><body style="margin:0;background:#fff3ea;color:#2d1a0e;font-family:system-ui,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:32px"><p style="color:#c96b2f;font-weight:700">88La 犒賞系存錢</p><h1 style="font-size:28px">已完成退訂</h1><p style="line-height:1.8">之後不會再寄送 88La 電子報給你。</p><a href="${SITE}" style="color:#c96b2f">回到官網</a></main></body></html>`;
}

async function handleUnsubscribe(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const token = String(req.query?.token || "").trim().toLowerCase();
  if (!TOKEN_RE.test(token)) return res.status(400).json({ error: "invalid_token" });

  const lookup = await getDocument(`newsletterUnsubscribes/${token}`);
  const subscriber = lookup?.subscriberId ? await getDocument(`newsletterSubscribers/${lookup.subscriberId}`) : null;
  if (!subscriber) return res.status(404).json({ error: "not_found" });

  const now = new Date().toISOString();
  const { id, ...subscriberData } = subscriber;
  await setDocument(`newsletterSubscribers/${id}`, {
    ...subscriberData,
    status: "unsubscribed",
    unsubscribedAt: now,
    updatedAt: now,
  });
  if (req.method === "POST") return res.status(200).send("");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(unsubscribeSuccessPage());
}

async function handleSend(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const subject = String(req.body?.subject || "").trim();
  const body = String(req.body?.body || "").trim();
  const campaignId = String(req.body?.campaignId || "").trim();
  if (!subject || subject.length > 160 || !body || body.length > 20000 || !CAMPAIGN_RE.test(campaignId)) {
    return res.status(400).json({ error: "invalid_campaign" });
  }
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: "email_service_not_configured" });
  if (await getDocument(`newsletterCampaigns/${campaignId}`)) return res.status(409).json({ error: "campaign_already_sent" });

  const allSubscribers = await listCollection("newsletterSubscribers");
  const subscribers = allSubscribers.filter((item) => item.status !== "unsubscribed" && EMAIL_RE.test(String(item.email || "")));
  if (subscribers.length === 0) return res.status(400).json({ error: "no_subscribers" });

  const now = new Date().toISOString();
  for (const subscriber of subscribers) {
    if (!subscriber.unsubscribeToken) {
      subscriber.unsubscribeToken = crypto.randomBytes(24).toString("hex");
      const { id, ...subscriberData } = subscriber;
      await setDocument(`newsletterSubscribers/${id}`, { ...subscriberData, updatedAt: now });
    }
    await setDocument(`newsletterUnsubscribes/${subscriber.unsubscribeToken}`, { subscriberId: subscriber.id, createdAt: now });
  }

  const fromAddress = String(process.env.EMAIL_FROM || "hello@88lamoney.com").trim();
  const from = fromAddress.includes("<") ? fromAddress : `88La 犒賞系存錢 <${fromAddress}>`;
  const batches = chunksOf(subscribers, 100);
  const resendIds = [];

  for (let index = 0; index < batches.length; index += 1) {
    const messages = batches[index].map((subscriber) => {
      const url = unsubscribeUrl(subscriber.unsubscribeToken);
      return {
        from,
        to: [subscriber.email],
        reply_to: "hello@88lamoney.com",
        subject,
        html: `<div style="max-width:620px;margin:0 auto;padding:24px;color:#2d1a0e;font-family:system-ui,sans-serif"><p style="color:#c96b2f;font-weight:700">88La 犒賞系存錢</p>${renderBody(body)}<hr style="border:0;border-top:1px solid #ead5c0;margin:28px 0"><p style="font-size:12px;color:#765f53;line-height:1.7">你收到這封信，是因為曾在 88La 官網訂閱電子報。<a href="${url}" style="color:#c96b2f">取消訂閱</a></p></div>`,
        headers: {
          "List-Unsubscribe": `<${url}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `newsletter-${campaignId}-${index}`,
        "User-Agent": "88la-site/1.0",
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Resend batch failed (${response.status}): ${result.message || result.name || "unknown"}`);
    resendIds.push(...(result.data || []).map((item) => item.id).filter(Boolean));
  }

  await setDocument(`newsletterCampaigns/${campaignId}`, {
    subject,
    recipientCount: subscribers.length,
    batchCount: batches.length,
    resendIds,
    sentAt: now,
    sentBy: String(admin.email || "").toLowerCase(),
  });
  return res.status(200).json({ ok: true, recipientCount: subscribers.length, batchCount: batches.length });
}

export default async function handler(req, res) {
  try {
    if (req.query?.action === "unsubscribe") return await handleUnsubscribe(req, res);
    if (req.query?.action === "send") return await handleSend(req, res);
    return res.status(404).json({ error: "not_found" });
  } catch (error) {
    console.error("Newsletter request failed", error);
    return res.status(500).json({ error: "newsletter_request_failed" });
  }
}

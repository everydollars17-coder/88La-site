import crypto from "node:crypto";
import { setDocument } from "./_security.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: "invalid_email" });

  try {
    const id = crypto.createHash("sha256").update(email).digest("hex");
    await setDocument(`newsletterSubscribers/${id}`, {
      email,
      source: "site",
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "save_failed" });
  }
}

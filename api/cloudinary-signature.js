import crypto from "node:crypto";
import { requireAdmin } from "./_security.js";

function signParams(params, secret) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return res.status(500).json({ error: "cloudinary_not_configured" });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "88la-site";
  const params = { timestamp, folder };
  return res.status(200).json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature: signParams(params, apiSecret),
  });
}

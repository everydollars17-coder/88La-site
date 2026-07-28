import { requireAdmin, setDocument } from "./_security.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const user = await requireAdmin(req, res);
  if (!user) return;

  const password = String(req.body?.password || "").trim();
  if (!password || password.length < 4) return res.status(400).json({ error: "invalid_password" });

  try {
    await setDocument("site/memberPassword", { value: password, updatedAt: new Date().toISOString(), updatedBy: user.email });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "save_failed" });
  }
}

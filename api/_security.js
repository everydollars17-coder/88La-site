import crypto from "node:crypto";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "barbara-760bb";
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyCW8TU318MtXe50MjjqWmmHDydFXv-zA3E";
const DEFAULT_ADMIN_EMAILS = "everydollars17@gmail.com";

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : "";
}

export async function verifyFirebaseUser(idToken) {
  if (!idToken) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.users?.[0] || null;
}

export async function requireAdmin(req, res) {
  const user = await verifyFirebaseUser(readBearerToken(req));
  const email = user?.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) {
    res.status(403).json({ error: "admin_required" });
    return null;
  }
  return user;
}

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  const account = JSON.parse(raw);
  if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, "\n");
  return account;
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExp - 60 > now) return cachedAccessToken;

  const account = serviceAccount();
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.private_key, "base64");
  const assertion = `${unsigned}.${signature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!r.ok) throw new Error(`Failed to get Firebase access token: ${r.status}`);
  const data = await r.json();
  cachedAccessToken = data.access_token;
  cachedAccessTokenExp = now + Number(data.expires_in || 3600);
  return cachedAccessToken;
}

function firestoreUrl(path) {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
}

export async function firestoreFetch(path, init = {}) {
  const token = await getAccessToken();
  return fetch(firestoreUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export function decodeFirestoreValue(value) {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ("mapValue" in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return null;
}

export function decodeFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

export function encodeFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "object") return { mapValue: { fields: encodeFirestoreFields(value) } };
  return { stringValue: String(value) };
}

export function encodeFirestoreFields(data = {}) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeFirestoreValue(value)]));
}

export async function getSiteValue(key) {
  const r = await firestoreFetch(`site/${encodeURIComponent(key)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore read failed: ${r.status}`);
  const data = await r.json();
  return decodeFirestoreValue(data.fields?.value);
}

export async function setDocument(path, data) {
  const r = await firestoreFetch(path, {
    method: "PATCH",
    body: JSON.stringify({ fields: encodeFirestoreFields(data) }),
  });
  if (!r.ok) throw new Error(`Firestore write failed: ${r.status}`);
  return r.json();
}

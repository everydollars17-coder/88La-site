import fs from "node:fs";
import path from "node:path";

const read = file => fs.readFileSync(path.resolve(file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
};

const seoRoutes = [
  "app", "plans", "pricing", "savings-bag", "resources", "tool-quiz", "journal", "about",
  "community", "shop", "goods", "ig", "guide", "newsletter", "contact", "terms", "privacy", "disclaimer",
];
const resourceRoutes = [
  "credit-card-reserve", "declutter-check", "emergency-fund-quiz", "golden-circle",
  "insurance-safety-fund", "savings-bag-quiz", "spending-check", "survival-line",
];

for (const slug of seoRoutes) {
  const html = read(`dist/__seo/${slug}.html`);
  assert(html.includes(`rel="canonical" href="https://site.88lamoney.com/${slug}"`), `/${slug} has a self canonical URL`);
  assert(!html.includes('<title>88La 犒賞系存錢</title>'), `/${slug} has its own title`);
}

for (const slug of resourceRoutes) {
  const html = read(`dist/resources/${slug}/index.html`);
  assert(html.includes(`rel="canonical" href="https://site.88lamoney.com/resources/${slug}/index.html"`), `${slug} resource has a self canonical URL`);
  assert(html.includes('name="description"'), `${slug} resource has a description`);
}

const sitemap = read("api/sitemap.js");
for (const slug of ["guide", "newsletter", "contact", ...resourceRoutes.map(item => `resources/${item}/index.html`)]) {
  assert(sitemap.includes(`loc: "/${slug}"`), `sitemap includes /${slug}`);
}

const app = read("src/App.jsx");
assert(app.includes('const PUBLIC_CONTACT_EMAIL = "hello@88lamoney.com"'), "public contact email uses hello@88lamoney.com");
assert(app.includes('const ADMIN_EMAILS = ["everydollars17@gmail.com"]'), "admin login email remains unchanged");
assert(app.includes('normalizeValueForKey(key, val)'), "Firestore content is normalized by content type");
assert(app.includes('/api/newsletter?action=send'), "admin newsletter UI uses the protected send endpoint");

const newsletter = read("api/newsletter.js");
assert(newsletter.includes("requireAdmin(req, res)"), "newsletter send requires Firebase admin authentication");
assert(newsletter.includes('https://api.resend.com/emails/batch'), "newsletter uses Resend batch delivery");
assert(newsletter.includes('"Idempotency-Key"'), "newsletter batches use idempotency keys");
assert(newsletter.includes('"List-Unsubscribe-Post"'), "newsletter includes one-click unsubscribe headers");
assert(newsletter.includes("status: \"unsubscribed\""), "unsubscribe updates subscriber status");

const apiFunctions = fs.readdirSync(path.resolve("api")).filter(file => file.endsWith(".js"));
assert(apiFunctions.length <= 12, `API function count stays within 12, actual ${apiFunctions.length}`);

const scannedFiles = ["index.html", "src/App.jsx", "api/sitemap.js", "vercel.json"];
for (const file of scannedFiles) {
  const content = read(file);
  assert(!content.includes("88la-site.vercel.app"), `${file} has no old site URL`);
}

console.log("Domain migration verification passed");

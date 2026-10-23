// Contact form mailer (Cloudflare Worker). Receives the form from the site and sends it
// to the owner through Resend. Settings (Cloudflare > the worker > Settings > Variables and Secrets):
//   RESEND_API_KEY  secret  the Resend API key
//   TO_EMAIL        text    the address that receives the messages
//   FROM_EMAIL      text    optional sender, "Portfolio <onboarding@resend.dev>" by default
//   TURNSTILE_SECRET secret optional: Cloudflare Turnstile secret key. When set, every message must carry a
//                           valid Turnstile token (the spam check on the form).
// Binding (wrangler.toml): RATE, a KV namespace that counts messages per IP address. Without it there is no limit.

const ALLOWED_ORIGINS = ["https://qalibqurbanov.github.io", "http://localhost:1337", "http://localhost:1338"];
/** At most this many messages from one IP address per window. */
const LIMIT = 5;
const WINDOW_SECONDS = 60 * 60;
const MAX = { name: 100, email: 200, message: 5000, page: 300 };

const COLOR = {
  bg: "#07060d",
  surface: "#100e19",
  surface2: "#161324",
  border: "#282340",
  accent: "#b185ff",
  accent2: "#22d3ee",
  text: "#ebe9f5",
  muted: "#8d89a6",
};
/** The site owner's initials, as in the badge on the site's window title bars. */
const BADGE = "GG";
const MONO = "'JetBrains Mono',Consolas,'Courier New',monospace";
const SANS = "Inter,Arial,Helvetica,sans-serif";

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The terminal-in-a-window mail. Inline styles and tables only: mail apps ignore the rest. */
function renderHtml({ name, email, message, page }) {
  const n = escapeHtml(name);
  const e = escapeHtml(email);
  const p = escapeHtml(page);
  const m = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const line = (key, value) =>
    `<div style="font-family:${MONO};font-size:13px;line-height:1.7;color:${COLOR.muted}">$ <span style="color:${COLOR.accent2}">${key}</span> <span style="color:${COLOR.accent}">${value}</span></div>`;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:12px;border-collapse:separate;overflow:hidden">
  <tr><td style="background:${COLOR.surface2};border-bottom:1px solid ${COLOR.border};padding:8px 10px 8px 20px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${MONO};font-size:12px;color:${COLOR.muted}">
        <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;border:1px solid ${COLOR.border};border-radius:4px;font-size:8px;font-weight:700;color:${COLOR.accent};vertical-align:middle">${BADGE}</span>
        <span style="vertical-align:middle;padding-left:6px">&quot;${n}&quot; sent you a message</span>
      </td>
      <td align="right" style="font-family:${MONO};font-size:13px;color:${COLOR.muted};opacity:.4;white-space:nowrap">&#8211;&nbsp;&nbsp;&#9633;&nbsp;&nbsp;&#215;</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:22px">
    ${line("from", `&quot;${n}&quot;`)}
    ${line("email", `<a href="mailto:${e}" style="color:${COLOR.accent};text-decoration:none">${e}</a>`)}
    ${line("page", `<a href="${p}" style="color:${COLOR.accent};text-decoration:none">${p}</a>`)}
    <div style="margin:14px 0;padding:14px;background:${COLOR.surface2};border-left:2px solid ${COLOR.accent};color:${COLOR.text};font-family:${SANS};font-size:14px;line-height:1.6">${m}</div>
    <a href="mailto:${e}" style="display:inline-block;padding:9px 16px;border:1px solid ${COLOR.accent};border-radius:6px;color:${COLOR.accent};text-decoration:none;font-family:${MONO};font-size:13px">reply to &quot;${e}&quot;</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function renderText({ name, email, message, page }) {
  return `${name} <${email}>\n${page}\n\n${message}\n`;
}

/** Asks Cloudflare whether the Turnstile token the form sent is real. */
async function passedCheck(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

/** Counts this message against the sender's IP address. Returns 0 when it may go ahead, or
 * how many seconds the sender has to wait once the limit is reached.
 * A failing store never blocks a real message. */
async function waitSeconds(env, ip) {
  if (!env.RATE || !ip) return 0;
  try {
    const key = `ip:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const saved = await env.RATE.get(key, "json");
    const entry = saved && saved.resetAt > now ? saved : { count: 0, resetAt: now + WINDOW_SECONDS };
    if (entry.count >= LIMIT) return Math.max(1, entry.resetAt - now);
    // The store wants an expiry at least a minute ahead.
    await env.RATE.put(key, JSON.stringify({ count: entry.count + 1, resetAt: entry.resetAt }), { expiration: Math.max(entry.resetAt, now + 60) });
    return 0;
  } catch {
    return 0;
  }
}

function reply(body, status, origin, extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Expose-Headers"] = "Retry-After";
    headers.Vary = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      const headers = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Max-Age": "86400",
      };
      if (ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") return reply({ ok: false, error: "method" }, 405, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return reply({ ok: false, error: "origin" }, 403, origin);

    let form;
    try {
      form = await request.formData();
    } catch {
      return reply({ ok: false, error: "form" }, 400, origin);
    }
    const field = (key) => String(form.get(key) ?? "").trim();
    const data = { name: field("name"), email: field("email"), message: field("message"), page: field("page") };

    const tooLong = Object.keys(MAX).some((key) => data[key].length > MAX[key]);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    if (!data.name || !data.message || !validEmail || tooLong) return reply({ ok: false, error: "fields" }, 400, origin);

    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    if (!(await passedCheck(env, String(form.get("cf-turnstile-response") ?? ""), ip))) return reply({ ok: false, error: "check" }, 403, origin);
    const wait = await waitSeconds(env, ip);
    if (wait > 0) return reply({ ok: false, error: "rate" }, 429, origin, { "Retry-After": String(wait) });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [env.TO_EMAIL],
        reply_to: data.email,
        subject: `Portfolio - ${data.name} sent you a message`,
        html: renderHtml(data),
        text: renderText(data),
      }),
    });
    if (!response.ok) return reply({ ok: false, error: "send" }, 502, origin);
    return reply({ ok: true }, 200, origin);
  },
};

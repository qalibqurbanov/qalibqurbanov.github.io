# Mail sending (contact form)

Written so that future me can read it in five minutes and remember what is going on.

## The idea in one picture

```
visitor fills the form
        |
        v
website (GitHub Pages) ---- cannot hold secrets, it is only static files
        |
        v   posts name, email, message, page
Cloudflare Worker  (worker/index.js) ---- small program that holds the secret key
        |
        v
Resend ---- the service that really sends the e-mail
        |
        v
my inbox:  "Portfolio - <name> sent you a message"

If the Cloudflare Worker or Resend fails:
website (browser) -> Web3Forms -> my inbox   (same subject, Web3Forms's own template)
If that fails too: the visitor sees an error and can try again.
```

## Why it is built like this

- GitHub Pages only serves files. Anything in the website's code is public, so a mail key cannot live there.
- So a tiny separate program (a Cloudflare Worker) sits in between. It keeps the Resend key secret and builds the mail with my own design (a dark terminal-style window, like the project windows on the site).
- Web3Forms was the first solution. It works, but its mail design cannot be changed on the free plan. It is kept as the backup.

## Spam protection

Three layers, from the visitor's side to the inbox:

1. **Form in the browser** (weak, only stops casual spam): a hidden trap field, no send within 2.5 s of opening, 30 s between sends, 3 per hour.
2. **Cloudflare Turnstile** (free invisible captcha): the form shows nothing unless it doubts the visitor. The Send button waits until the check passes. The check's token goes to the Cloudflare Worker, which verifies it with Cloudflare before sending anything. Needs `VITE_TURNSTILE_SITE_KEY` (site) and `TURNSTILE_SECRET` (Cloudflare Worker secret). Without them the check is simply off.
3. **Limit per visitor in the Cloudflare Worker**: at most 3 messages per hour from one IP address (the same number as the browser limit, so the form never says two different numbers), counted in a small Cloudflare store (the `RATE` KV namespace in `worker/wrangler.toml`). Over the limit the visitor sees the "please wait" message.

Also: the Cloudflare Worker only accepts requests from the live site and localhost, and the recipient is fixed (`TO_EMAIL`), so nobody can use it to mail other people.

The Web3Forms backup is used only when the Cloudflare Worker is **down** (no answer or a server error). If it **refuses** a message (failed check, too many messages) that is final, otherwise the backup would let spam around the checks. The backup key is public: in the Web3Forms dashboard restrict it to the site's domain and turn on its spam filter.

## The pieces

| Piece | What it is | Cost |
|---|---|---|
| Website form | `website/src/components/contact/ContactModal.tsx` | free (GitHub Pages) |
| Cloudflare Worker | `worker/index.js`, also pasted into Cloudflare as `portfolio-mail` | free tier |
| Resend | sends the mail, holds the API key | free tier |
| Web3Forms | backup sender | free tier |

Cloudflare Worker address: `https://portfolio-mail.qalibqurbanow.workers.dev/`

## Settings and where they are

| Setting | Where | What it does |
|---|---|---|
| `VITE_CONTACT_ENDPOINT` | GitHub repo > Settings > Secrets and variables > Actions > Variables | the Cloudflare Worker address the form posts to |
| `VITE_CONTACT_FALLBACK_ENDPOINT` | same place | backup address (Web3Forms), tried only if the first fails |
| `VITE_CONTACT_ACCESS_KEY` | same place, Secrets | the Web3Forms key (it ends up public in the site anyway) |
| `RESEND_API_KEY` | Cloudflare > the Cloudflare Worker > Settings > Variables and Secrets | the Resend key, never in the repo |
| `TURNSTILE_SECRET` | same place | the Turnstile secret key; without it the Cloudflare Worker does not check tokens |
| `TO_EMAIL` | same place | where messages are delivered |
| `FROM_EMAIL` | same place (optional) | sender, default `Portfolio <onboarding@resend.dev>` |
| `VITE_TURNSTILE_SITE_KEY` | GitHub repo > Variables | the Turnstile site key (public); without it the form shows no check |

The `VITE_` settings are read when the website is built. After changing one, re-run the "Deploy to GitHub Pages" workflow (Actions tab).

## Good to know

- Resend's free test sender only delivers to the address I signed up to Resend with. To mail any address I would need my own domain verified in Resend.
- Mails from `onboarding@resend.dev` can land in spam. Fix: Gmail filter, from that address, "never send to spam".
- The Cloudflare Worker only accepts requests from the live site and localhost ports 1337 and 1338 (`ALLOWED_ORIGINS` at the top of the file).
- The form protects itself in the browser: a hidden trap field, no send within 2.5 s of opening, 30 s between sends, 3 per hour. The Cloudflare Worker also checks the fields and their length.
- The visitor's address is the reply-to, so pressing Reply writes back to them.
- Without any endpoint (for example local development without `website/.env.local`), the form opens the visitor's own mail app instead (`mailto:`).

## Common tasks

**Change the mail design or subject**
1. Edit `worker/index.js` (`renderHtml` is the design, the subject is in the Resend call near the bottom).
2. Deploy it, either way:
   - Fast: double-click `scripts/deploy-mail.bat`. It installs what is missing, asks for the Cloudflare login the first time (opens the browser), then deploys. The settings and secrets in the Cloudflare dashboard are kept. (By terminal: `node scripts/deploy-mail.mjs`.)
   - By hand: Cloudflare > Workers & Pages > `portfolio-mail` > Edit code > select all, delete, paste the whole file > Deploy.
3. The website does not need a redeploy for this.

Mail apps ignore most CSS, so the design uses tables and inline styles only.

**Change where mail goes:** edit `TO_EMAIL` in Cloudflare (Variables and Secrets), then Deploy there.

**Replace a leaked or old Resend key:** create a new key in Resend (Sending access), delete the old one, put the new one in `RESEND_API_KEY` in Cloudflare (Variables and Secrets), Deploy.

**Deploying the Cloudflare Worker without losing its settings:** always use `scripts/deploy-mail.bat`. It reads the variables of the version that is live (names and values, never printed), and gives them to `wrangler deploy` again. A plain `wrangler deploy` can remove the variables that were typed into the Cloudflare dashboard: that happened twice and mail stopped until the settings were restored (with `npx wrangler rollback <version>` to a version that still had them, then deploying with the script). Do not save the Variables page in the dashboard while the live version and the newest version differ: the page may start from the newest one.

**Change the success or error texts shown on the site:** `website/src/content/en.ts` (and `az.ts`, `ru.ts`), section `contactModal`.

**Turn the backup off:** delete the `VITE_CONTACT_FALLBACK_ENDPOINT` variable and re-run the deploy.

## When something does not work

| Symptom | Check |
|---|---|
| The form shows an error | Open the Cloudflare Worker address in a browser. It should answer `{"ok":false,"error":"method"}`. If it does not, the Cloudflare Worker or the endpoint variable is wrong. |
| Cloudflare Worker answers but mail does not come | Cloudflare > the Cloudflare Worker > Logs. `error: send` means Resend refused: wrong or missing key, or `TO_EMAIL` is not the Resend signup address. |
| `error: check` (403) | The Turnstile check failed: wrong secret, or the site's address is not listed in the Turnstile widget's hostnames. |
| `error: rate` (429) | More than 3 messages from this IP address in an hour. |
| `error: origin` | The site's address is missing from `ALLOWED_ORIGINS`. |
| Mail is in spam | See "Good to know". |
| The form opens my mail app instead of sending | The endpoint was empty when the site was built. Set it and re-run the deploy. |
| Changed a variable, nothing changed | The site reads it at build time. Re-run the deploy. |

Free plan limits (check the dashboards for today's numbers): Cloudflare Workers about 100,000 requests a day, Resend a few thousand mails a month, Web3Forms about 250 a month.

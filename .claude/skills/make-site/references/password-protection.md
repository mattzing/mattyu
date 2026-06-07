# Password-protecting a site

GitHub Pages (and any plain static host) serves files publicly — there is no
server to check a password. So "password protection" on a static site means one
of two very different things. Pick based on how sensitive the content is.

## Contents
- [Option A — client-side encryption (bundled, works on GitHub Pages)](#option-a)
- [What it protects — and what it does NOT](#what-it-protects)
- [Option B — real server-side auth (stronger, needs another host/plan)](#option-b)
- [Rules that keep the gate from leaking](#rules)

## Option A — client-side encryption (bundled) {#option-a}

The page's real HTML is **AES-256-GCM** encrypted at build time with a key
derived from the password (**PBKDF2-SHA-256, 220k iterations**). What gets
deployed is a small "lock screen" plus the ciphertext. When a visitor types the
password, the browser derives the key and decrypts the page locally (Web
Crypto); a wrong password fails the AES-GCM auth tag and can't decrypt anything.
Same model as StatiCrypt.

Build it with the bundled script:
```bash
MAKE_SITE_PASSWORD='correct-horse-battery-staple' \
  node scripts/protect-page.mjs site.html dist/index.html --title "Private"
```
- `site.html` is your finished page; `dist/index.html` is the gated page you
  deploy. Pass the password via the env var, not as an argument (args show up in
  shell history and process lists).
- Then deploy `dist/` exactly like any static site.

The encryptor (`scripts/lib-crypto.mjs`) and the in-browser decryptor
(`assets/locked-template.html`) use the same Web Crypto parameters, so they
interoperate exactly — keep them in sync if you change either.

(Equivalent off-the-shelf tool: `npx staticrypt site.html -d dist`. Same security
properties; use whichever you prefer.)

## What it protects — and what it does NOT {#what-it-protects}

Good for: keeping a page away from casual visitors and out of search engines,
sharing something semi-private by handing the password around, "soft" privacy.

Be honest about the limits — this is encryption shipped to the client:
- **Only as strong as the password.** The ciphertext is downloadable, so a weak
  password can be brute-forced offline. Use a long, random one. The script
  refuses passwords under 8 characters; longer + random is much better.
- **Anyone with the password** can read and re-share the decrypted page. No
  per-user accounts, no revocation, no access logs.
- **Not for secrets or regulated data** (credentials, PII, anything you'd be hurt
  by leaking). For that, use Option B.

## Option B — real server-side auth (stronger) {#option-b}

These check the password (or identity) on a server before serving anything:
- **Cloudflare Pages + Cloudflare Access** (Zero Trust) — free tier; gate by
  one-time PIN, email domain, or an identity provider. Means hosting on
  Cloudflare Pages instead of GitHub Pages.
- **Netlify** site-level password / **Vercel** Deployment Protection — built-in
  auth gates on their paid plans.
- **A Cloudflare Worker / serverless function** in front of the site doing HTTP
  Basic Auth — a little code, but a real server-side check.

Trade-off: each needs a different host and/or a paid plan (and outbound network
to that provider). Reach for them when the content actually matters.

## Rules that keep the gate from leaking {#rules}

- **Deploy ONLY the gated output.** Never leave the original unprotected page in
  the published folder — e.g. don't ship both `site.html` and the gated
  `index.html` in the same deploy dir, or the plaintext is reachable at
  `/site.html`. Keep the source outside the publish directory.
- **A public repo exposes the plaintext source.** Pages repos are usually
  public, and the gate only encrypts the *deployed* page — the unprotected
  source committed to the repo is still browsable on github.com. For genuine
  privacy, don't commit the plaintext to a public repo: keep the source in a
  private repo (or out of version control) and commit/deploy only the gated
  output.
- **No sensitive data in side files.** Images/JSON/etc. deployed next to the gate
  are still public. Inline anything sensitive into the page that gets encrypted.
- **Every page needs its own gate.** A multi-page site must encrypt each page (or
  only link to gated pages) — the gate protects one HTML file at a time.
- **Re-deploying replaces the artifact**, so to change the password just
  re-run `protect-page.mjs` with the new password and deploy again.

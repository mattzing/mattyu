---
name: make-site
description: >-
  Turn any idea into a live, public website with a real shareable URL — built
  and deployed to GitHub Pages in one go (auto-enabled, no tokens, no manual
  setup). Use this whenever the user wants to make, build, publish, launch, spin
  up, or "put online" a website, landing page, portfolio, microsite, web app,
  resume, event page, or any web idea and actually have it hosted at a live link
  — not just a local file or a Claude artifact. Trigger even when the user only
  describes the idea ("a site for my coffee shop", "a personal homepage", "a
  countdown page for our launch", "throw my bio online") and clearly wants it on
  the internet. Also use to update or redeploy a site previously made this way.
---

# Make Site

Take a rough idea and hand back a **live URL**. The user describes what they
want; you design a genuinely good site and publish it to GitHub Pages at
`https://mattzing.github.io/<repo>/`. The magic is the short distance from
"I want a page for X" to a link they can text a friend.

Bias hard toward shipping. A polished, real, *live* page beats a perfect mockup
that only exists locally. Get something live, then iterate with the user.

## The flow

1. **Nail the idea** (lightly) — enough to design with intent. Don't interrogate.
2. **Build the site** — one self-contained `index.html` for most ideas; scale up
   only when the idea truly needs it.
3. **Deploy** — push the files plus the bundled workflow; it auto-enables Pages
   and publishes.
4. **Hand off the URL** — share the link and offer the next iteration.

---

## Step 1 — Nail the idea

Most prompts already contain enough to start. Fill gaps with tasteful defaults
rather than a questionnaire — you can always revise once it's live. Settle on:

- **Purpose & audience** — what the page is for, who lands on it, the one action
  or impression that matters most.
- **Content** — the actual words/sections. If the user didn't give copy, draft
  real, specific copy (not lorem ipsum) and tell them you've drafted it so they
  can correct it.
- **A bold aesthetic direction** — commit to ONE point of view (editorial,
  brutalist, retro-futuristic, luxe minimal, playful, etc.). See
  [Design bar](#design-bar). Don't default to generic.

Ask a question only when a choice genuinely changes the build and you can't pick
a sensible default (e.g. "is this a single page or does it need separate
pages?"). One or two crisp questions, max.

## Step 2 — Build the site

**Default to a single self-contained `index.html`** — markup, CSS in a `<style>`
tag, JS in a `<script>` tag, small images as data URIs or remote URLs. It ships
in seconds, has zero asset-path pitfalls on Pages, and covers the large majority
of ideas (landing pages, portfolios, bios, event/countdown pages, simple tools,
one-pagers). Tailwind via CDN is fine if it helps.

Scale up only when the idea demands it:
- **A few static pages** (e.g. home + about + contact) → multiple `.html` files
  with **relative** links (`./about.html`). Keep assets relative too.
- **A real app** (state, routing, components) → a Vite/React build. This adds a
  build step and a base-path config; see `references/github-pages.md` →
  "Sites that need a build step". Reach for this only when warranted — it's
  slower to first-live.

Quick scaffold (optional): `scripts/new-site.sh <name>` creates a folder with a
placeholder `index.html` and the deploy workflow already in place. **Replace the
placeholder** — never ship it. Preview locally anytime with
`python3 -m http.server` before deploying.

### Design bar

The whole point is a site that looks *made*, not generated. Commit to the
aesthetic direction from Step 1 and execute it precisely.

- **Typography** carries the design. Use distinctive, characterful fonts (Google
  Fonts is great). **Never** Inter/Roboto/Arial/system defaults. Pair a display
  font with a clean body font.
- **Color** — one cohesive palette with a dominant color and a sharp accent, via
  CSS variables. Avoid the purple-gradient-on-white AI cliché.
- **Layout** — intentional. Asymmetry, overlap, generous negative space, or
  controlled density — not everything centered in a single column.
- **Detail & motion** — atmosphere over flat fills: subtle texture, depth,
  considered shadows, one well-orchestrated load animation (staggered reveals),
  hover states that feel alive. Match effort to the vision: maximalist = rich;
  minimal = precise restraint.
- **Responsive & accessible** — looks right on a phone, real contrast, alt text,
  sensible semantics.

No two sites should look the same. If a `frontend-design` skill is available,
lean on it for the build — this skill's job is the idea→live-URL pipeline; that
one sweats the pixels.

## Step 3 — Deploy to GitHub Pages

The repo carries `.github/workflows/deploy-pages.yml` (bundled in this skill's
`assets/`). On its first run it **enables Pages by itself** via
`actions/configure-pages` (`enablement: true`) using the workflow's own token —
so there's nothing to click in Settings and no personal access token. One repo =
one site, files at the repo root, is the clean default.

**Preferred path — GitHub MCP tools** (Claude Code on the web):
1. `mcp__github__create_repository` — short slug name, `autoInit: true`,
   **public** (Pages needs a public repo on free plans).
2. `mcp__github__push_files` — one commit to `main` with every file *including*
   `.github/workflows/deploy-pages.yml`. That push starts the deploy.
3. Poll `mcp__github__actions_list` / `mcp__github__actions_get` until the
   "Deploy to GitHub Pages" run succeeds (~30–90s; read logs with
   `get_job_logs` if it fails).

**Fallback — plain git** (works wherever `git push` to GitHub is wired up, incl.
the authenticated proxy in web sessions): create the repo, then
`git init -b main && git add -A && git commit && git push -u origin main`.

Both paths and every detail (build-step apps, asset-path gotchas, custom
domains, redeploying, troubleshooting) live in **`references/github-pages.md`** —
read it when deploying or when anything deviates from the happy path.

> Want a different host (Vercel / Netlify / Surge) instead? See
> `references/other-hosts.md`. They give instant `*.vercel.app`-style URLs but
> need an account/token and outbound network to that provider — GitHub Pages is
> the zero-setup default.

## Step 4 — Hand off

Give the user the **live URL** plainly: `https://mattzing.github.io/<repo>/`.
Mention it can take an extra minute to go live on the very first deploy (a brief
404 right after the run is normal). Then offer the obvious next move — tweak copy
or colors, add a section, wire a custom domain — and remember: updating is just
another push to `main`, which redeploys automatically.

---

## Reference files

- `references/github-pages.md` — the full deploy playbook: MCP vs git paths,
  watching the run, build-step apps, base paths, custom domains, redeploys,
  troubleshooting. **Read before deploying.**
- `references/other-hosts.md` — Vercel / Netlify / Surge recipes for when the
  user wants a different host.
- `assets/deploy-pages.yml` — the auto-enable + deploy workflow to copy into
  every site repo.
- `scripts/new-site.sh` — scaffolds a site folder (placeholder + workflow).

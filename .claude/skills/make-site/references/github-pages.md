# Deploying to GitHub Pages

The full mechanics behind Step 3 of the skill. The headline trick: a bundled
GitHub Actions workflow (`assets/deploy-pages.yml`) that **enables Pages by
itself on its first run**, so there are no manual Settings clicks and no
personal access tokens. You just need a repo and a push.

## Contents
- [Why the workflow approach](#why-the-workflow-approach)
- [Path A — GitHub MCP tools (Claude Code on the web)](#path-a--github-mcp-tools-claude-code-on-the-web)
- [Path B — plain git (any environment with git auth)](#path-b--plain-git-any-environment-with-git-auth)
- [Watching the deploy + getting the URL](#watching-the-deploy--getting-the-url)
- [Sites that need a build step (React/Vite/Astro/etc.)](#sites-that-need-a-build-step)
- [Asset paths — the #1 gotcha](#asset-paths--the-1-gotcha)
- [Updating / redeploying a site](#updating--redeploying-a-site)
- [Custom domains](#custom-domains)
- [Troubleshooting](#troubleshooting)

## Why the workflow approach

GitHub Pages can be served three ways: from a branch (legacy, runs Jekyll),
by manually flipping a Settings toggle, or via **GitHub Actions**. The Actions
path is the only one that's fully scriptable end-to-end:

- `actions/configure-pages@v5` with `enablement: true` calls the Pages API and
  turns Pages on for the repo if it isn't already — using the workflow's own
  `GITHUB_TOKEN`, which the workflow grants `pages: write` + `id-token: write`.
- `actions/upload-pages-artifact@v3` packages the static files (no Jekyll, so
  no `_`-folder surprises and no `.nojekyll` needed).
- `actions/deploy-pages@v4` publishes the artifact and outputs `page_url`.

So the recipe is always: **put `deploy-pages.yml` in the repo, push to `main`,
wait for the run.** The published URL is `https://<owner>.github.io/<repo>/`.
For this account that's `https://mattzing.github.io/<repo>/`.

> One repo = one site, files at the repo root, is the clean default. It gives
> the tidiest URL and avoids path headaches. Only use a subfolder/monorepo
> layout if the user specifically wants several sites in one repo (then point
> the workflow's `path:` at the subfolder, and note only one Pages site exists
> per repo).

## Path A — GitHub MCP tools (Claude Code on the web)

This is the smoothest path in a web session — no local git needed.

1. **Create the repo** — `mcp__github__create_repository`
   - `name`: a short slug for the site (e.g. `coffee-shop`)
   - `autoInit: true` (gives you a `main` branch to push onto)
   - `private: false` — Pages on a free plan needs a **public** repo. If the
     user wants it private, tell them Pages requires GitHub Pro for private
     repos, or keep it public.
2. **Push the files in one commit** — `mcp__github__push_files` with `branch:
   main` and a `files` array containing every file: `index.html`, any CSS/JS/
   images, and `.github/workflows/deploy-pages.yml` (copy from this skill's
   `assets/`). Pushing the workflow is what kicks off the deploy.
3. **Watch the run** and return the URL (see below).

> Scope note: the GitHub MCP server may be scoped to specific repos in a
> session. If a call against the new repo is denied, either add it to scope
> (`add_repo`, or `mcp__claude-code-remote__list_repos` to find it) or fall
> back to Path B. Don't tell the user it's impossible before checking.

## Path B — plain git (any environment with git auth)

Works wherever `git push` to GitHub is wired up (including Claude Code on the
web, where the origin remote is an authenticated proxy).

```bash
# 0. Build the site into a folder first (e.g. with scripts/new-site.sh)
cd my-site

# 1. Create the empty repo on GitHub. Without the `gh` CLI, create it via the
#    GitHub MCP `create_repository` tool, or have the user click "New repo".
#    Then:
git init -b main
git add -A
git commit -m "Initial site"
git remote add origin https://github.com/mattzing/<repo>.git
git push -u origin main
```

The push triggers the workflow, which enables Pages and deploys.

## Watching the deploy + getting the URL

The first run takes ~30–90s. With MCP tools:

- `mcp__github__actions_list` — find the "Deploy to GitHub Pages" run.
- `mcp__github__actions_get` — poll until `status: completed`,
  `conclusion: success`.
- `mcp__github__get_job_logs` — read logs if it fails.

The live URL is deterministic: **`https://<owner>.github.io/<repo>/`**. You can
report it as soon as the run succeeds (the `deploy` step also emits `page_url`).
Pages can take an extra minute to go live on the very first deploy — if it 404s
briefly, that's normal; give it a moment.

## Sites that need a build step

For React/Vite/Next (static export)/Astro/SvelteKit (static)/etc., add the build
before the upload and point `path` at the output. Replace the upload/deploy tail
of `deploy-pages.yml`'s job steps with:

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build        # outputs to ./dist (Vite) or ./build, etc.
      - uses: actions/configure-pages@v5
        with:
          enablement: true
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'          # <-- match your tool's output dir
      - id: deployment
        uses: actions/deploy-pages@v4
```

Crucially, set the framework's **base path** to the repo name, or all assets
404 under `/<repo>/`:
- Vite: `base: '/<repo>/'` in `vite.config.js`
- Next (static export): `basePath: '/<repo>'` + `output: 'export'`
- Astro: `base: '/<repo>'` and `site` in `astro.config.mjs`

When in doubt, prefer a single self-contained `index.html` — it sidesteps all
of this and ships in seconds.

## Asset paths — the #1 gotcha

A project site lives at `https://<owner>.github.io/<repo>/`, **not** at the
domain root. So absolute paths like `/style.css` or `/img/logo.png` resolve to
`https://<owner>.github.io/style.css` and break. Fixes:
- Use **relative** paths: `./style.css`, `assets/logo.png`, `./about.html`.
- Or add `<base href="/<repo>/">` in `<head>`.
- Or inline everything into one `index.html` (CSS in `<style>`, JS in
  `<script>`, small images as data URIs) — zero path risk, instant deploy.

## Updating / redeploying a site

Push another commit to `main` (MCP `push_files` or `git push`) — the workflow
runs again and republishes. To redeploy without a content change, trigger the
`workflow_dispatch` event via `mcp__github__actions_run_trigger`.

## Custom domains

Add a `CNAME` file at the site root containing just the domain
(`www.example.com`), commit it, then point DNS at GitHub Pages (a `CNAME`
record to `<owner>.github.io`, or `A` records to GitHub's Pages IPs). GitHub
provisions HTTPS automatically once DNS validates.

## Troubleshooting

- **Run failed at "Configure Pages"** — usually permissions. Confirm the
  workflow has `permissions: pages: write` and `id-token: write` (the bundled
  file does). On some org repos, Actions managing Pages is disabled by policy;
  then enable Pages once in Settings → Pages → Source: "GitHub Actions".
- **`Create Pages site failed. Error: Resource not accessible by integration`**
  — the repo's Actions `GITHUB_TOKEN` is an integration/GitHub-App token that
  hasn't been granted Pages *administration*, so `enablement: true` can't create
  the site. This shows up on integration-managed repos (e.g. some Claude Code on
  the web sessions). The token usually still has `Pages: write` for *deploys* —
  so the fix is a one-time manual enable by a human admin: **Settings → Pages →
  Build and deployment → Source: "GitHub Actions"**, then re-run the workflow.
  Once the site exists, `configure-pages` finds it instead of trying to create
  it, and the deploy proceeds.
- **Deploy fails in ~1s with no logs (job never gets a runner)** — the
  `github-pages` environment restricts deployments to the **default branch** by
  default, and you're deploying from another branch. Either deploy from the
  default branch (the bundled workflow triggers on `main`, so this normally
  never bites), or open Settings → Environments → github-pages → Deployment
  branches and tags → "No restriction" (or add the branch).
- **404 after a successful run** — give it 1–2 minutes on first deploy; confirm
  you're hitting `/<repo>/` (trailing slash) and that asset paths are relative.
- **Blank page / missing styles** — absolute asset paths; see the gotcha above.
- **Private repo** — Pages on free plans needs a public repo (or GitHub Pro).

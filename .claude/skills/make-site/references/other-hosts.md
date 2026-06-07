# Alternative hosts

GitHub Pages is this skill's default because it needs no extra account or
token and works wherever GitHub auth is wired up. These alternatives give
instant `*.host` URLs and easy custom domains, but each needs an account +
token and outbound network to that provider (which is sometimes blocked in
sandboxed/remote environments — check before promising it). Use one of these
when the user explicitly asks for it or already has an account configured.

All three deploy a folder of static files; the skill's Step 1 (build the site)
is identical — only the deploy command changes.

## Vercel

```bash
npm i -g vercel            # or: npx vercel
vercel login              # opens browser / device flow; or set VERCEL_TOKEN
vercel --prod --yes       # from the site folder; prints a *.vercel.app URL
```

- Non-interactive CI: `vercel --prod --yes --token "$VERCEL_TOKEN"`.
- For build-step apps, Vercel auto-detects the framework and runs the build.
- Custom domains via `vercel domains add` or the dashboard.

## Netlify

```bash
npm i -g netlify-cli       # or: npx netlify-cli
netlify login             # or set NETLIFY_AUTH_TOKEN
netlify deploy --prod --dir .   # --dir points at the static files / build output
```

- First run links/creates a site; prints a `*.netlify.app` URL.
- Non-interactive: pass `--auth "$NETLIFY_AUTH_TOKEN" --site <id>`.

## Surge.sh

The lowest-ceremony option — one command, email signup on first use, no
dashboard required.

```bash
npm i -g surge            # or: npx surge
surge ./ my-site.surge.sh # publishes the current folder to that subdomain
```

- First run prompts for an email + password (creates the account inline).
- Re-running the same command redeploys; `surge teardown my-site.surge.sh`
  removes it.

## Choosing

| Host          | URL                     | Account/token | Best for |
|---------------|-------------------------|---------------|----------|
| GitHub Pages  | `user.github.io/repo`   | none (uses GitHub) | default; permanent, versioned, free |
| Vercel        | `*.vercel.app`          | account + token | framework apps, great DX, custom domains |
| Netlify       | `*.netlify.app`         | account + token | static + forms/functions, simple CLI |
| Surge.sh      | `*.surge.sh`            | email signup   | throwaway/quick static demos |

If you switch a site's host later, the build artifact is the same — just run
the other provider's deploy command against the same folder.

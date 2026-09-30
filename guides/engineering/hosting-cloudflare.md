# Hosting on Cloudflare with nobutt.org

Written 2026-09-30 from a conversation. The user asked how Cloudflare's free hosting works, to publish this repo
there under nobutt.org. The "current state" section was checked on the day. The Cloudflare facts come from my
knowledge (mid-2026) and are **not checked against Cloudflare's docs yet**. Check them before relying on them.

## Current state (checked 2026-09-30)

- **Hosting:** GitHub Pages, from `main` of `github.com/lorinc/gamedev` (branch deploy). `.github/workflows/checks-and-pages.yml.todo`
  is an unused Actions deploy.
- **Site:** plain static files, no build step. Git tracks 7,803 files. The biggest is `spelunking/timeline/index.html` at
  ~400 KB. The deployable tree is ~103 MB, without `node_modules`, `.git`, `.cdp-profile` and `temp/`.
- **Domain:** nobutt.org is registered at Porkbun and uses Porkbun's nameservers (`*.ns.porkbun.com`). The apex
  resolves to 207.207.210.229 / .107. `www` is a CNAME to `pixie.porkbun.com`, which is Porkbun's parking/forwarding,
  so nothing is served there yet.

## How Cloudflare's free static hosting works (unverified)

- **Two products do the same job:** Cloudflare **Pages** and **Workers with static assets**. Cloudflare has been
  steering new projects toward Workers. For a site with no server code, either one works.
- **Free tier for static files:** no bandwidth or request charge for static assets. The limits are on the build side
  (a monthly build count on Pages), files per deployment (about 20,000), and file size (25 MiB per file). This repo is
  well under all of them.
- **Deploy options:**
  1. **Connect the GitHub repo:** Cloudflare builds and deploys on every push to `main`. With no build step, the
     build command is empty and the output directory is the repo root.
  2. **Direct upload:** `npx wrangler pages deploy <dir>` (or `wrangler deploy` for Workers) from this machine.
     Wrangler would be a dev tool, not a runtime dependency, and still needs a justification row
     (ENGINEERING.md → Dependencies).
- **Headers:** a `_headers` file in the output directory sets HTTP headers per path. GitHub Pages can't do that. It
  makes **COOP/COEP cross-origin isolation** possible, which `SharedArrayBuffer` needs. That in turn unblocks the
  sim-in-a-worker option in [ideal_sw_architecture.md](ideal_sw_architecture.md) §4. Portals may still not allow it
  ([03](03-web-portal-requirements.md)).
- **Custom domain:**
  - **Apex (`nobutt.org`):** the domain has to become a Cloudflare zone. You add the site to a free Cloudflare
    account, then switch the nameservers at Porkbun to the two Cloudflare gives you. Registration stays at Porkbun.
    DNS is then managed in Cloudflare, not Porkbun.
  - **Subdomain only (e.g. `play.nobutt.org`):** a CNAME at Porkbun to `<project>.pages.dev` is enough, and the
    nameservers can stay at Porkbun.
- **Previews:** each branch and deployment gets its own `*.pages.dev` URL, which is handy for a test build on the
  phone that isn't live yet.

## Things to decide or check before moving

- Apex vs subdomain. This decides whether the nameservers move to Cloudflare.
- The GitHub integration vs wrangler direct upload. The integration also deploys `main`, so `npm run ship` would keep
  working unchanged.
- What gets published. Today it's the whole repo, including `concepts/`, `guides/` and the timeline. Cloudflare
  could publish just the same tree.
- Whether GitHub Pages stays on as a mirror, or is switched off, so there's one canonical URL.
- A `.gitignore`d or excluded path must not leak: `temp/` and `.cdp-profile/` are gitignored, so a git-connected
  deploy never sees them. A direct upload from the working directory would, unless it's pointed at a clean export.

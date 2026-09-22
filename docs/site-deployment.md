# Public site deployment

No public domain has been selected. Local and preview builds deliberately omit
canonical URLs and absolute sharing URLs, emit `noindex, nofollow`, return a
robots policy disallowing crawling, and generate an empty sitemap.

When a public domain is ready, supply `PUBLIC_SITE_URL` as a build-time environment
variable and run `pnpm run build`. Use an HTTPS origin with no path, query,
fragment, credentials or custom port. A trailing slash is accepted and normalized.
IP addresses, local names and reserved development suffixes are rejected. An absent
or invalid value keeps the site nonindexable rather than guessing from the request.
Only configure this value for the intended production domain, not a temporary preview.

The static adapter writes the site to `build/`. Serve that directory with the
host’s normal clean-URL behavior. Configure unknown URLs to return HTTP 404;
the static adapter is not configured to generate a fallback `404.html`. The Svelte
error page handles errors reached through the app, while direct missing-URL
responses depend on the host. The preview manager used in the development container is not
a production deployment mechanism.

The shared metadata catalog covers the homepage, About, Status, Examples, Showcase
and all current documentation routes. Both server rendering and client navigation
use it. `/robots.txt` points to `/sitemap.xml` only with a valid configured origin.
Labs, demos and error pages are nonindexable and excluded from the sitemap.
The sharing card is `static/social-card.png`; its editable source is the adjacent
SVG. No deployment hostname is embedded in either asset.

Before publishing, run the checks in the README and inspect the generated output:

- Public pages have one title and description, a canonical URL at the chosen
  origin, and matching Open Graph and Twitter metadata.
- The sitemap includes every guide and excludes the lab and demo routes.
- Robots permits the public site and advertises the correct sitemap.
- The sharing image resolves, and an unknown route returns a nonindexable 404.

A new domain requires a rebuild because the public origin is compiled into the
static output. No runtime request host is trusted as a canonical origin.

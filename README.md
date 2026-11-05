<p align="center">
  <img src="meerkat-logo.svg" alt="Meerkat MFT logo" width="120">
</p>

# mmft.dev

Source for [mmft.dev](https://mmft.dev), the website for [Meerkat MFT](https://github.com/meerkat-mft/mmft), an open source managed file transfer orchestrator in early development.

The site is a single static page served by GitHub Pages. It has no JavaScript and no third-party requests.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The landing page. Markup and CSS in one file. |
| `404.html` | Served by Pages for any unknown path. |
| `fonts/` | Self-hosted Fraunces and IBM Plex Mono, with their licences. |
| `mmft/index.html` | Go vanity-import page for `mmft.dev/mmft`. See below. |
| `og.png`, `meerkat-*.png`, `meerkat-logo.svg` | Social preview image and icons. |
| `robots.txt`, `sitemap.xml` | Crawler hints. The sitemap lists the front page only. |
| `.well-known/security.txt` | Where to report security issues ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)). |
| `CNAME` | Custom domain for GitHub Pages. |
| `.nojekyll` | Tells Pages to serve the files as they are. |
| `scripts/status.py` | Fills the project-status figures at deploy time. See below. |
| `.github/workflows/` | Deploy and CI workflows. |
| `.htmlvalidate.json`, `lighthouserc.json` | CI configuration; not published. |

## Local preview

Any static file server works. From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Merging to `main` publishes the site through the [Deploy workflow](.github/workflows/deploy.yml). It copies the repository into `_site/`, leaving out repo files such as this README, fills in the project-status figures, and hands the result to GitHub Pages. The workflow also runs nightly so those figures stay current. Each deploy is listed under the repository's `github-pages` environment, where an earlier one can be redeployed. The custom domain is verified against the `meerkat-mft` organisation and HTTPS is enforced.

Pull requests run the [CI workflow](.github/workflows/ci.yml): HTML validation ([html-validate](https://html-validate.org/), config in `.htmlvalidate.json`), a link check ([lychee](https://lychee.cli.rs/)), a check that every module directory carries `go-import` and `go-source` tags, and [Lighthouse](https://github.com/GoogleChrome/lighthouse-ci) with the thresholds in `lighthouserc.json`.

To run the validator locally:

```bash
npx html-validate "**/*.html"
```

## Project status figures

The "Follow along" section shows the latest release, the date of the last commit and the number of open issues in the [mmft repository](https://github.com/meerkat-mft/mmft). The page in this repository carries fallback text in elements marked `data-status="…"`; at deploy time [`scripts/status.py`](scripts/status.py) reads the GitHub API and replaces it. If the API is unreachable the fallback text ships and the deploy still succeeds. CI runs the script with `--strict` so a broken placeholder or API change is caught on the pull request.

Nothing runs in the browser; the figures are plain text in the published HTML.

## Go vanity imports

`go get mmft.dev/mmft` works because `mmft/index.html` carries a `go-import` meta tag pointing at the GitHub repository, and a `go-source` tag so pkg.go.dev can link to files and lines:

```html
<meta name="go-import" content="mmft.dev/mmft git https://github.com/meerkat-mft/mmft">
<meta name="go-source" content="mmft.dev/mmft https://github.com/meerkat-mft/mmft https://github.com/meerkat-mft/mmft/tree/main{/dir} https://github.com/meerkat-mft/mmft/blob/main{/dir}/{file}#L{line}">
```

The Go tool fetches this page over HTTPS and does not run JavaScript, so the tags have to be in static HTML. Subpackages such as `mmft.dev/mmft/cmd/...` resolve through the same page. A new module under `mmft.dev/` needs its own directory with an equivalent page; CI checks that every such directory carries both tags for its own path.

## Security headers

GitHub Pages does not let a site set HTTP response headers, so the pages carry what can be expressed in `<meta>` tags instead:

- A `Content-Security-Policy` of `default-src 'none'` with only same-origin styles, fonts, images and connections allowed. The `style-src 'unsafe-inline'` is for the page's own `<style>` block; there is no script.
- `referrer` set to `strict-origin-when-cross-origin`.

Not possible on Pages, and known gaps if you scan the site: `frame-ancestors` and `X-Frame-Options` (a meta CSP cannot carry `frame-ancestors`), `Permissions-Policy`, and custom `Cache-Control`. HSTS is covered by the `.dev` top-level domain being on the browser preload list.

## Contributing

Every change goes through a pull request against `main`. Keep the page dependency-free unless a feature clearly needs more; the current design is a deliberate choice for a security product's front door.

Copy and design changes are welcome as issues or pull requests. For the product itself, see the [mmft repository](https://github.com/meerkat-mft/mmft).

## Security

See [SECURITY.md](SECURITY.md).

## Licence

The HTML, CSS and build files in this repository are licensed under the [MIT Licence](LICENSE), so you are welcome to reuse the layout, the font setup or the `go-import` page pattern.

Not covered by that licence:

- The written content of the site (the product copy) is © Meerkat MFT contributors. Quote it, but don't republish it as your own.
- The Meerkat MFT name and logo.
- The fonts in `fonts/`, which are distributed under the SIL Open Font License ([Fraunces](fonts/LICENSE-Fraunces.txt), [IBM Plex Mono](fonts/LICENSE-IBM-Plex-Mono.txt)).

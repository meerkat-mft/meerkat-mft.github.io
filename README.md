<p align="center">
  <img src="meerkat-logo.svg" alt="Meerkat MFT logo" width="120">
</p>

# mmft.dev

Source for [mmft.dev](https://mmft.dev), the website for [Meerkat MFT](https://github.com/meerkat-mft/mmft), an open source managed file transfer orchestrator in early development.

The site is a single static page served by GitHub Pages. It has no build step, no JavaScript and no third-party requests.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The landing page. Markup and CSS in one file. |
| `fonts/` | Self-hosted Fraunces and IBM Plex Mono, with their licences. |
| `mmft/index.html` | Go vanity-import page for `mmft.dev/mmft`. See below. |
| `og.png`, `meerkat-*.png`, `meerkat-logo.svg` | Social preview image and icons. |
| `.well-known/security.txt` | Where to report security issues ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)). |
| `CNAME` | Custom domain for GitHub Pages. |
| `.nojekyll` | Tells Pages to serve the files as they are. |

## Local preview

Any static file server works. From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Merging to `main` publishes the site. GitHub Pages serves the `main` branch root directly; there is no workflow yet. The custom domain is verified against the `meerkat-mft` organisation and HTTPS is enforced.

## Go vanity imports

`go get mmft.dev/mmft` works because `mmft/index.html` carries a `go-import` meta tag pointing at the GitHub repository:

```html
<meta name="go-import" content="mmft.dev/mmft git https://github.com/meerkat-mft/mmft">
```

The Go tool fetches this page over HTTPS and does not run JavaScript, so the tag has to be in static HTML. Subpackages such as `mmft.dev/mmft/cmd/...` resolve through the same page. A new module under `mmft.dev/` needs its own directory with an equivalent page.

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

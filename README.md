# Site Lens Audit

![License](https://img.shields.io/badge/license-MIT-2e735e)
![Node](https://img.shields.io/badge/node-18%2B-1f2320)
![Status](https://img.shields.io/badge/status-MVP-9a5b1f)

Site Lens Audit is a local website audit tool for SEO, accessibility and frontend quality checks. It fetches a public URL, reads the HTML and turns common launch issues into a practical score, issue list and exportable report.

It is intentionally small: Node.js, Express, Cheerio and a vanilla HTML/CSS/JS frontend. No database. No auth. No Lighthouse dependency in the first version.

## Why this exists

Small teams often need a quick pre-launch check before running heavier tools. Site Lens Audit focuses on the basics that are easy to miss:

- Is the page understandable to search engines?
- Can assistive technology read the main controls and content?
- Does the HTML look unnecessarily heavy?
- Are there obvious fixes a developer can make in a few minutes?

## Features

- Audit any public HTTP or HTTPS URL.
- Generate an overall score from 0 to 100.
- SEO checks for:
  - title
  - meta description
  - H1 count
  - heading structure
  - images without alt text
  - internal and external links
  - canonical URL
  - Open Graph tags
- Accessibility checks for:
  - missing `lang`
  - images without alt text
  - links and buttons without accessible text
  - inputs without labels
  - skipped heading levels
- Estimated performance checks for:
  - HTML size
  - script count
  - CSS resource count
  - images without `loading="lazy"`
  - viewport meta tag
- Export reports as JSON or Markdown.
- Safe URL handling with timeouts, HTML size limits and private-network blocking.

## Demo workflow

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

Paste:

```text
https://example.com
```

## Installation

Requirements:

- Node.js 18 or newer
- npm

```bash
git clone https://github.com/YOUR_USERNAME/site-lens-audit.git
cd site-lens-audit
npm install
npm start
```

## Development

```bash
npm run dev
```

Syntax check:

```bash
npm run check
```

## API

### `POST /api/audit`

Request:

```json
{
  "url": "https://example.com"
}
```

Response shape:

```json
{
  "auditedAt": "2026-05-31T19:30:22.046Z",
  "url": "https://example.com/",
  "finalUrl": "https://example.com/",
  "score": 74,
  "summary": {
    "title": "Example Domain",
    "description": "",
    "h1": "Example Domain",
    "htmlSize": "528 B",
    "contentType": "text/html"
  },
  "seo": {
    "score": 45
  },
  "accessibility": {
    "score": 100
  },
  "performance": {
    "score": 100
  },
  "suggestions": [
    {
      "category": "SEO",
      "severity": "high",
      "title": "Missing meta description",
      "suggestion": "Add a short meta description for search previews."
    }
  ]
}
```

## Example Markdown export

```markdown
# Site Lens Audit Report

URL: https://example.com/
Audited at: 2026-05-31T19:30:22.046Z

## Scores

- Overall: 74/100
- SEO: 45/100
- Accessibility: 100/100
- Performance: 100/100

## Suggestions

- **HIGH / SEO:** Missing meta description - Add a short meta description for search previews.
```

## Security model

Site Lens Audit is a local development tool, not a public crawling service. The MVP includes basic safeguards:

- Only `http` and `https` URLs are accepted.
- `localhost`, loopback and private-network IPs are blocked.
- DNS results are checked before fetching.
- Requests timeout after 10 seconds.
- HTML responses are capped at roughly 1.5 MB.
- Invalid URLs return JSON errors instead of crashing the server.

If you deploy this publicly, add rate limiting, request logging, stronger SSRF defenses, queueing and abuse monitoring.

## Roadmap

- Optional Lighthouse integration.
- PageSpeed Insights API integration.
- Robots.txt and sitemap.xml checks.
- Crawl multiple pages with a configurable page limit.
- Save local history as static JSON files.
- Compare two reports over time.
- Add CLI mode.
- Add PDF export.
- Add richer WCAG-oriented accessibility checks.

## Contributing

Contributions are welcome. Good first issues include adding checks, improving the report UI, writing tests and expanding export formats.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).

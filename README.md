# Site Lens Audit

Site Lens Audit is a local open source website auditor for SEO, accessibility and frontend quality checks.

It fetches a public webpage, reads the HTML and returns a practical report with scores, issues and suggestions. This first version does not use Lighthouse, a database or authentication.

## Features

- URL input for public HTTP and HTTPS pages.
- Backend fetches and analyzes HTML.
- SEO checks:
  - title
  - meta description
  - H1
  - heading structure
  - images without alt text
  - internal and external links
  - canonical URL
  - Open Graph tags
- Accessibility checks:
  - images without alt text
  - links and buttons without text
  - inputs without labels
  - skipped heading levels
  - missing `lang` attribute
- Estimated performance checks:
  - HTML size
  - script count
  - CSS resource count
  - images without lazy loading
  - viewport meta tag
- Overall score from 0 to 100.
- Suggestions shown as cards.
- Export report as JSON or Markdown.

## Tech Stack

- Node.js
- Express
- Cheerio
- HTML, CSS and JavaScript

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Then open:

```text
http://127.0.0.1:3000
```

Paste a URL such as:

```text
https://example.com
```

## Example JSON Output

```json
{
  "url": "https://example.com/",
  "score": 82,
  "summary": {
    "title": "Example Domain",
    "description": "Missing",
    "htmlSize": "1.2 KB"
  },
  "seo": {
    "score": 74
  },
  "accessibility": {
    "score": 88
  },
  "performance": {
    "score": 91
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

## Example Markdown Output

```markdown
# Site Lens Audit Report

URL: https://example.com/
Audited at: 2026-05-31T19:20:00.000Z

## Scores

- Overall: 82/100
- SEO: 74/100
- Accessibility: 88/100
- Performance: 91/100

## Suggestions

- **HIGH / SEO:** Missing meta description — Add a short meta description for search previews.
```

## Security Notes

This MVP validates URLs before fetching them.

- Only `http` and `https` URLs are allowed.
- `localhost`, loopback and private network addresses are blocked.
- Requests timeout after 10 seconds.
- HTML responses are capped at roughly 1.5 MB.
- Invalid URLs return a safe JSON error instead of crashing the server.

This is still a local development tool, not a hardened public SaaS proxy.

## Roadmap

- Add Lighthouse integration as an optional deeper audit.
- Add PageSpeed Insights API support.
- Add historical comparisons without requiring a database.
- Add sitemap crawling with a page limit.
- Add richer accessibility checks.
- Add robots.txt and sitemap.xml checks.
- Add PDF export.
- Add CLI mode.

## License

MIT

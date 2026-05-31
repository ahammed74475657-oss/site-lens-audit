# Site Lens Audit v1.0.0

First public MVP release.

## Highlights

- Local website auditor for SEO, accessibility and frontend quality.
- Express backend that fetches public HTML.
- Vanilla frontend with report cards and score breakdown.
- JSON and Markdown export.
- Basic SSRF-oriented safety checks for local usage.

## What is not included yet

- Lighthouse.
- PageSpeed Insights.
- Multi-page crawling.
- Stored history.
- Authentication.

## Suggested GitHub release text

```markdown
Site Lens Audit v1.0.0 is the first MVP release.

It can audit a public URL and report:

- SEO score and metadata issues
- accessibility issues
- estimated frontend performance checks
- prioritized suggestions
- JSON and Markdown exports

This release intentionally avoids Lighthouse so the project stays small and easy to run locally.
```

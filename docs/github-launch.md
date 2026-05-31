# GitHub Launch Checklist

Use this after pushing the repository.

## Repository settings

- Description: `Local website audit tool for SEO, accessibility and frontend quality checks.`
- Website: leave blank unless you deploy it.
- Topics:
  - `seo`
  - `accessibility`
  - `audit`
  - `frontend`
  - `express`
  - `nodejs`
  - `web-performance`
- Features:
  - Issues: enabled
  - Discussions: optional
  - Projects: optional

## Milestones

Create these milestones:

### v1.1 - Audit depth

Goal: Add more page-level checks without adding Lighthouse yet.

Suggested issues:

- robots.txt and sitemap.xml detection
- richer ARIA checks
- canonical URL validation

### v1.2 - Reporting

Goal: Make reports easier to save, compare and share.

Suggested issues:

- report comparison mode
- PDF export
- sample reports folder

### v2.0 - Web Vitals

Goal: Add optional Lighthouse or PageSpeed Insights integration.

Suggested issues:

- optional Lighthouse runner
- PageSpeed Insights API key support
- Core Web Vitals section in report UI

## Release steps

```bash
git push -u origin main
git push origin v1.0.0
```

Then draft a GitHub release from `v1.0.0` using `docs/release-v1.0.0.md`.

## First post

Suggested launch copy:

```text
I built Site Lens Audit, a tiny local tool that audits a public page for SEO basics, accessibility issues and estimated frontend quality.

It runs with Node + Express, uses no database and exports reports as JSON or Markdown.

I am keeping v1 intentionally small before adding optional Lighthouse/PageSpeed support.
```

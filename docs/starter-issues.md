# Starter Issues

Use these after the repository is pushed to GitHub.

## 1. Add robots.txt and sitemap.xml checks

Labels: `enhancement`, `SEO`, `good first issue`

Description:

Add checks that detect whether the audited domain exposes `/robots.txt` and `/sitemap.xml`. The result should appear in the SEO section and include suggestions when either file is missing or unreachable.

## 2. Add CLI mode for terminal audits

Labels: `enhancement`, `CLI`

Description:

Add a command such as:

```bash
npm run audit -- https://example.com
```

The CLI should print the score and write JSON or Markdown output.

## 3. Add tests for URL safety validation

Labels: `test`, `security`, `good first issue`

Description:

Add automated tests for invalid URLs, private IPs, localhost, unsupported protocols and timeout handling.

## 4. Improve accessibility checks for ARIA usage

Labels: `accessibility`, `enhancement`

Description:

Detect common ARIA issues such as empty `aria-label`, invalid `aria-labelledby` references and interactive elements without accessible names.

## 5. Add report comparison mode

Labels: `enhancement`, `reporting`

Description:

Let users compare two exported JSON reports and show score changes, new issues and resolved issues.

## Optional GitHub CLI commands

After creating and pushing the repo, run:

```bash
gh issue create --title "Add robots.txt and sitemap.xml checks" --label "enhancement,good first issue" --body-file docs/starter-issues.md
```

For cleaner issues, copy each section into its own `gh issue create` command.

# Contributing

Thanks for taking a look at Site Lens Audit.

## Local setup

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## Checks before a pull request

```bash
npm run check
```

Also test at least one real URL manually, such as:

```text
https://example.com
```

## Good first contributions

- Add a new SEO check.
- Add a new accessibility check.
- Improve report export formatting.
- Improve error messages.
- Add tests for URL validation.
- Add documentation examples.

## Pull request style

- Keep changes focused.
- Explain the user-visible behavior.
- Include screenshots for UI changes.
- Do not add a database or authentication unless the issue asks for it.
- Do not add Lighthouse as a required dependency in the MVP path.

## Commit style

Use clear, plain commit messages:

```text
feat: add robots.txt detection
fix: handle pages without body content
docs: expand API examples
```

# Security Policy

## Supported versions

The current MVP release is supported for security fixes.

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## Reporting a vulnerability

Please open a private security advisory on GitHub if available, or create an issue with a minimal description that does not expose exploit details.

Useful information:

- Affected URL pattern or input.
- Expected behavior.
- Actual behavior.
- Steps to reproduce locally.

## Current safeguards

- Blocks localhost and private network targets.
- Restricts URLs to HTTP and HTTPS.
- Resolves DNS before fetching.
- Uses request timeouts.
- Caps HTML response size.
- Returns safe JSON errors for invalid input.

## Known limits

This is a local development tool. Before exposing it publicly, add:

- Rate limiting.
- Stronger SSRF protection.
- Request logging.
- Abuse monitoring.
- Deployment-specific network egress rules.

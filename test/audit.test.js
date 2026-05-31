import assert from "node:assert/strict";
import test from "node:test";
import { analyzeHtml, formatBytes, isPrivateAddress, normalizeUrl } from "../server.js";

test("normalizeUrl accepts domains without protocols", () => {
  const url = normalizeUrl("example.com/path#section");

  assert.equal(url.href, "https://example.com/path");
});

test("normalizeUrl rejects unsupported protocols", () => {
  assert.throws(() => normalizeUrl("file:///etc/passwd"), /Only HTTP and HTTPS/);
});

test("isPrivateAddress detects common private ranges", () => {
  assert.equal(isPrivateAddress("127.0.0.1"), true);
  assert.equal(isPrivateAddress("10.0.0.2"), true);
  assert.equal(isPrivateAddress("172.16.4.5"), true);
  assert.equal(isPrivateAddress("192.168.1.10"), true);
  assert.equal(isPrivateAddress("8.8.8.8"), false);
});

test("formatBytes formats byte values", () => {
  assert.equal(formatBytes(528), "528 B");
  assert.equal(formatBytes(2048), "2.0 KB");
});

test("analyzeHtml scores a basic healthy document", () => {
  const report = analyzeHtml({
    url: "https://example.com/",
    contentType: "text/html",
    bytes: 900,
    html: `<!doctype html>
      <html lang="en">
        <head>
          <title>Example website audit landing page</title>
          <meta name="description" content="A practical example page with enough description text for an audit report preview.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="https://example.com/">
          <meta property="og:title" content="Example">
          <meta property="og:description" content="Example description">
          <meta property="og:image" content="https://example.com/og.png">
        </head>
        <body>
          <h1>Example website audit landing page</h1>
          <h2>Features</h2>
          <img src="/image.jpg" alt="Dashboard preview" loading="lazy">
          <a href="/docs">Read docs</a>
          <button>Start audit</button>
          <label for="email">Email</label>
          <input id="email" type="email">
        </body>
      </html>`
  });

  assert.equal(report.seo.data.h1Count, 1);
  assert.equal(report.accessibility.data.imagesWithoutAlt, 0);
  assert.equal(report.performance.data.viewport, true);
  assert.ok(report.score > 80);
});

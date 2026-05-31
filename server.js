import dns from "node:dns/promises";
import net from "node:net";
import express from "express";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_HTML_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 10000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.post("/api/audit", async (req, res) => {
  try {
    const targetUrl = normalizeUrl(req.body?.url);
    await assertSafePublicUrl(targetUrl);

    const { html, finalUrl, contentType, bytes } = await fetchHtml(targetUrl);
    const report = analyzeHtml({ html, url: finalUrl, contentType, bytes });

    res.json(report);
  } catch (error) {
    res.status(error.statusCode || 400).json({
      error: error.publicMessage || "We could not audit that URL.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`Site Lens Audit running at http://127.0.0.1:${PORT}`);
});

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw publicError("Enter a URL to audit.");
  }

  const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
    ? rawUrl.trim()
    : `https://${rawUrl.trim()}`;

  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw publicError("Use a valid URL, like https://example.com.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw publicError("Only HTTP and HTTPS URLs are supported.");
  }

  url.hash = "";
  return url;
}

async function assertSafePublicUrl(url) {
  const hostname = url.hostname.toLowerCase();
  const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

  if (blockedHosts.has(hostname) || hostname.endsWith(".local")) {
    throw publicError("Local and private network URLs are blocked in this version.");
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true }).catch(() => {
    throw publicError("We could not resolve that hostname.");
  });

  if (!records.length || records.some(record => isPrivateAddress(record.address))) {
    throw publicError("Private network targets are blocked for safety.");
  }
}

function isPrivateAddress(address) {
  if (net.isIPv6(address)) {
    return address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:");
  }

  if (!net.isIPv4(address)) return true;

  const [a, b] = address.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": "SiteLensAudit/1.0 (+https://github.com)"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw publicError(`The page returned HTTP ${response.status}.`, 502);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw publicError("That URL did not return HTML.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw publicError("The response body could not be read.", 502);

    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_HTML_BYTES) {
        throw publicError("The HTML is too large for this MVP audit.");
      }
      chunks.push(value);
    }

    const html = Buffer.concat(chunks).toString("utf8");
    return {
      html,
      finalUrl: response.url,
      contentType,
      bytes: Buffer.byteLength(html, "utf8")
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw publicError("The request timed out after 10 seconds.", 504);
    }
    throw error.publicMessage ? error : publicError("The page could not be fetched.");
  } finally {
    clearTimeout(timer);
  }
}

function analyzeHtml({ html, url, contentType, bytes }) {
  const $ = cheerio.load(html);
  const pageUrl = new URL(url);

  const title = cleanText($("title").first().text());
  const description = cleanText($('meta[name="description"]').attr("content") || "");
  const h1s = $("h1").map((_, el) => cleanText($(el).text())).get().filter(Boolean);
  const headings = $("h1,h2,h3,h4,h5,h6").map((_, el) => ({
    level: Number(el.tagName.slice(1)),
    text: cleanText($(el).text()).slice(0, 120)
  })).get();
  const images = $("img").map((_, el) => ({
    src: $(el).attr("src") || "",
    alt: $(el).attr("alt"),
    loading: $(el).attr("loading") || ""
  })).get();
  const links = $("a[href]").map((_, el) => {
    const href = $(el).attr("href") || "";
    const absolute = safeAbsoluteUrl(href, pageUrl);
    return {
      href,
      absolute,
      text: cleanText($(el).text()),
      internal: absolute ? absolute.hostname === pageUrl.hostname : false
    };
  }).get();
  const scripts = $("script[src],script:not([src])");
  const stylesheets = $('link[rel="stylesheet"],style');
  const inputs = $("input,textarea,select").map((_, el) => ({
    id: $(el).attr("id") || "",
    name: $(el).attr("name") || "",
    ariaLabel: $(el).attr("aria-label") || "",
    labelledBy: $(el).attr("aria-labelledby") || "",
    type: $(el).attr("type") || el.tagName
  })).get();
  const buttons = $("button,a").map((_, el) => ({
    tag: el.tagName,
    text: cleanText($(el).text()),
    ariaLabel: $(el).attr("aria-label") || "",
    title: $(el).attr("title") || "",
    href: $(el).attr("href") || ""
  })).get();

  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const openGraphTags = $('meta[property^="og:"]').length;
  const viewport = $('meta[name="viewport"]').attr("content") || "";
  const lang = $("html").attr("lang") || "";
  const imagesWithoutAlt = images.filter(image => typeof image.alt !== "string" || !image.alt.trim());
  const imagesWithoutLazy = images.filter(image => image.src && image.loading.toLowerCase() !== "lazy");
  const emptyControls = buttons.filter(control => !control.text && !control.ariaLabel && !control.title);
  const inputsWithoutLabels = inputs.filter(input => !hasInputLabel($, input));
  const headingIssues = findHeadingIssues(headings);
  const internalLinks = links.filter(link => link.internal).length;
  const externalLinks = links.filter(link => link.absolute && !link.internal).length;

  const seoChecks = [
    check(Boolean(title), "Missing title", "Add a unique title tag to explain the page in search results.", "high", "SEO", "Title tag is present"),
    check(title.length >= 25 && title.length <= 65, "Title length is not ideal", "Keep titles roughly between 25 and 65 characters.", "medium", "SEO", "Title length is healthy"),
    check(Boolean(description), "Missing meta description", "Add a short meta description for search previews.", "high", "SEO", "Meta description is present"),
    check(description.length >= 70 && description.length <= 160, "Meta description length is not ideal", "Aim for 70 to 160 characters.", "medium", "SEO", "Meta description length is healthy"),
    check(h1s.length === 1, "Page should have exactly one H1", `Found ${h1s.length} H1 elements.`, "high", "SEO", "Single H1 found"),
    check(headings.length > 1, "Weak heading structure", "Use headings to describe the content hierarchy.", "medium", "SEO", "Heading structure is present"),
    check(imagesWithoutAlt.length === 0, "Images missing alt text", `${imagesWithoutAlt.length} images do not have alt text.`, "high", "SEO", "Image alt text is complete"),
    check(Boolean(canonical), "Missing canonical URL", "Add a canonical link to reduce duplicate URL ambiguity.", "medium", "SEO", "Canonical URL is present"),
    check(openGraphTags >= 3, "Open Graph tags are incomplete", "Add og:title, og:description and og:image for social previews.", "low", "SEO", "Open Graph tags are present")
  ];

  const accessibilityChecks = [
    check(Boolean(lang), "Missing html lang attribute", "Add lang to the html element, like <html lang=\"en\">.", "high", "Accessibility", "HTML lang attribute is present"),
    check(imagesWithoutAlt.length === 0, "Images without alt text", `${imagesWithoutAlt.length} images need alt text or empty decorative alt attributes.`, "high", "Accessibility", "Images have alt text"),
    check(emptyControls.length === 0, "Links or buttons without accessible text", `${emptyControls.length} controls have no visible or accessible label.`, "high", "Accessibility", "Controls have accessible text"),
    check(inputsWithoutLabels.length === 0, "Inputs without labels", `${inputsWithoutLabels.length} form fields need labels or aria labels.`, "high", "Accessibility", "Inputs have labels"),
    check(headingIssues.length === 0, "Heading levels skip", headingIssues.join(" "), "medium", "Accessibility", "Heading levels do not skip")
  ];

  const performanceChecks = [
    check(bytes < 250_000, "Large HTML document", `HTML size is ${formatBytes(bytes)}. Large HTML can delay first render.`, "medium", "Performance", "HTML size is reasonable"),
    check(scripts.length <= 12, "Many script tags", `Found ${scripts.length} script tags.`, "medium", "Performance", "Script count is reasonable"),
    check(stylesheets.length <= 8, "Many CSS resources", `Found ${stylesheets.length} stylesheet/style blocks.`, "low", "Performance", "CSS resource count is reasonable"),
    check(imagesWithoutLazy.length <= Math.max(2, Math.round(images.length * 0.35)), "Images may need lazy loading", `${imagesWithoutLazy.length} images do not use loading=\"lazy\".`, "medium", "Performance", "Lazy loading coverage is reasonable"),
    check(Boolean(viewport), "Missing viewport meta tag", "Add a viewport meta tag for mobile rendering.", "high", "Performance", "Viewport meta tag is present")
  ];

  const score = calculateScore([...seoChecks, ...accessibilityChecks, ...performanceChecks]);

  return {
    auditedAt: new Date().toISOString(),
    url,
    finalUrl: url,
    score,
    summary: {
      title,
      description,
      h1: h1s[0] || "",
      htmlSize: formatBytes(bytes),
      contentType
    },
    seo: {
      score: calculateScore(seoChecks),
      checks: seoChecks,
      data: {
        title,
        titleLength: title.length,
        description,
        descriptionLength: description.length,
        h1Count: h1s.length,
        headings,
        imagesWithoutAlt: imagesWithoutAlt.length,
        links: {
          total: links.length,
          internal: internalLinks,
          external: externalLinks
        },
        canonical,
        openGraphTags
      }
    },
    accessibility: {
      score: calculateScore(accessibilityChecks),
      checks: accessibilityChecks,
      data: {
        lang,
        imagesWithoutAlt: imagesWithoutAlt.length,
        emptyControls: emptyControls.length,
        inputsWithoutLabels: inputsWithoutLabels.length,
        headingIssues
      }
    },
    performance: {
      score: calculateScore(performanceChecks),
      checks: performanceChecks,
      data: {
        htmlBytes: bytes,
        htmlSize: formatBytes(bytes),
        scripts: scripts.length,
        cssResources: stylesheets.length,
        images: images.length,
        imagesWithoutLazy: imagesWithoutLazy.length,
        viewport: Boolean(viewport)
      }
    },
    suggestions: [
      ...seoChecks,
      ...accessibilityChecks,
      ...performanceChecks
    ].filter(item => !item.passed).map(item => ({
      category: item.category,
      severity: item.severity,
      title: item.title,
      suggestion: item.suggestion
    }))
  };
}

function check(passed, title, suggestion, severity, category, label = title) {
  return {
    passed,
    title,
    label,
    suggestion,
    severity,
    category
  };
}

function calculateScore(checks) {
  const weights = { high: 10, medium: 6, low: 3 };
  const total = checks.reduce((sum, item) => sum + weights[item.severity], 0);
  const passed = checks.reduce((sum, item) => sum + (item.passed ? weights[item.severity] : 0), 0);
  return Math.max(0, Math.round((passed / total) * 100));
}

function findHeadingIssues(headings) {
  const issues = [];
  let previous = 0;

  for (const heading of headings) {
    if (previous && heading.level > previous + 1) {
      issues.push(`Skipped from H${previous} to H${heading.level}.`);
    }
    previous = heading.level;
  }

  return issues;
}

function hasInputLabel($, input) {
  if (input.type === "hidden") return true;
  if (input.ariaLabel || input.labelledBy) return true;
  if (input.id && $(`label[for="${cssEscape(input.id)}"]`).length) return true;
  if (input.name && $(`label[for="${cssEscape(input.name)}"]`).length) return true;
  return false;
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}

function safeAbsoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href ? new URL(href, baseUrl) : null;
  } catch {
    return null;
  }
}

function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function publicError(publicMessage, statusCode = 400) {
  const error = new Error(publicMessage);
  error.publicMessage = publicMessage;
  error.statusCode = statusCode;
  return error;
}

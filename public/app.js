const form = document.querySelector("#auditForm");
const urlInput = document.querySelector("#urlInput");
const formMessage = document.querySelector("#formMessage");
const results = document.querySelector("#results");
const exportPanel = document.querySelector("#exports");
const auditButton = document.querySelector("#auditButton");
let currentReport = null;

form.addEventListener("submit", async event => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return showError("Enter a URL to audit.");

  setLoading(true);
  try {
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url })
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Audit failed.");

    currentReport = payload;
    renderReport(payload);
    exportPanel.hidden = false;
    formMessage.textContent = `Audited ${payload.finalUrl}`;
    formMessage.className = "form-message";
  } catch (error) {
    currentReport = null;
    exportPanel.hidden = true;
    showError(error.message);
    renderEmpty();
  } finally {
    setLoading(false);
  }
});

document.querySelector("#exportJson").addEventListener("click", () => {
  if (!currentReport) return;
  downloadFile("site-lens-report.json", JSON.stringify(currentReport, null, 2), "application/json");
});

document.querySelector("#exportMarkdown").addEventListener("click", () => {
  if (!currentReport) return;
  downloadFile("site-lens-report.md", toMarkdown(currentReport), "text/markdown");
});

function setLoading(isLoading) {
  auditButton.disabled = isLoading;
  auditButton.textContent = isLoading ? "Auditing..." : "Run audit";
  if (isLoading) {
    formMessage.textContent = "Fetching the page and reading the HTML.";
    formMessage.className = "form-message";
    results.className = "results";
    results.innerHTML = `
      <div class="loading-grid">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    `;
  }
}

function showError(message) {
  formMessage.textContent = message;
  formMessage.className = "form-message error";
}

function renderEmpty() {
  results.className = "results empty-state";
  results.innerHTML = `
    <div class="empty-copy">
      <p class="eyebrow">Waiting for a URL</p>
      <h2>Your report will appear here.</h2>
      <p>Start with a homepage, landing page or article URL. The tool will fetch HTML, inspect the document and return prioritized suggestions.</p>
    </div>
  `;
}

function renderReport(report) {
  results.className = "results";
  results.innerHTML = `
    <div class="score-grid">
      ${scoreCard("Overall score", report.score, report.summary.htmlSize)}
      ${scoreCard("SEO", report.seo.score, `${report.seo.data.h1Count} H1`)}
      ${scoreCard("Accessibility", report.accessibility.score, `${report.accessibility.data.imagesWithoutAlt} image issues`)}
      ${scoreCard("Performance", report.performance.score, `${report.performance.data.scripts} scripts`)}
    </div>

    <div class="detail-grid">
      ${detailsCard("SEO checks", report.seo.checks)}
      ${detailsCard("Accessibility checks", report.accessibility.checks)}
      ${dataCard("Page facts", [
        ["Title", report.summary.title || "Missing"],
        ["Description", report.summary.description || "Missing"],
        ["Canonical", report.seo.data.canonical || "Missing"],
        ["Links", `${report.seo.data.links.internal} internal, ${report.seo.data.links.external} external`]
      ])}
      ${dataCard("Estimated performance", [
        ["HTML size", report.performance.data.htmlSize],
        ["Scripts", report.performance.data.scripts],
        ["CSS resources", report.performance.data.cssResources],
        ["Images without lazy loading", report.performance.data.imagesWithoutLazy],
        ["Viewport meta", report.performance.data.viewport ? "Present" : "Missing"]
      ])}
    </div>

    <section class="suggestions-grid" aria-label="Suggestions">
      ${report.suggestions.length ? report.suggestions.map(suggestionCard).join("") : `
        <article class="suggestion-card">
          <span class="badge low">Clean</span>
          <h3>No major issues found</h3>
          <p class="muted">The page passed the MVP checks. A Lighthouse integration would be the next deeper layer.</p>
        </article>
      `}
    </section>
  `;
}

function scoreCard(label, score, note) {
  return `
    <article class="score-card">
      <div class="score-number">${score}</div>
      <div class="score-label">${escapeHtml(label)}</div>
      <p class="muted">${escapeHtml(note)}</p>
    </article>
  `;
}

function detailsCard(title, checks) {
  return `
    <article class="card">
      <h3>${escapeHtml(title)}</h3>
      <ul class="check-list">
        ${checks.map(item => `
          <li>
            <strong class="${item.passed ? "pass" : "fail"}">${item.passed ? "OK" : "Fix"}</strong>
            <span>${escapeHtml(item.passed ? item.label : item.title)}</span>
          </li>
        `).join("")}
      </ul>
    </article>
  `;
}

function dataCard(title, rows) {
  return `
    <article class="card">
      <h3>${escapeHtml(title)}</h3>
      <ul class="check-list">
        ${rows.map(([label, value]) => `
          <li>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(String(value))}</span>
          </li>
        `).join("")}
      </ul>
    </article>
  `;
}

function suggestionCard(item) {
  return `
    <article class="suggestion-card">
      <span class="badge ${item.severity}">${escapeHtml(item.severity)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="muted">${escapeHtml(item.suggestion)}</p>
      <p><code>${escapeHtml(item.category)}</code></p>
    </article>
  `;
}

function toMarkdown(report) {
  const suggestionLines = report.suggestions.length
    ? report.suggestions.map(item => `- **${item.severity.toUpperCase()} / ${item.category}:** ${item.title} — ${item.suggestion}`).join("\n")
    : "- No major MVP issues found.";

  return `# Site Lens Audit Report

URL: ${report.finalUrl}
Audited at: ${report.auditedAt}

## Scores

- Overall: ${report.score}/100
- SEO: ${report.seo.score}/100
- Accessibility: ${report.accessibility.score}/100
- Performance: ${report.performance.score}/100

## Page facts

- Title: ${report.summary.title || "Missing"}
- Meta description: ${report.summary.description || "Missing"}
- HTML size: ${report.summary.htmlSize}
- H1: ${report.summary.h1 || "Missing"}
- Links: ${report.seo.data.links.internal} internal, ${report.seo.data.links.external} external

## Suggestions

${suggestionLines}
`;
}

function downloadFile(filename, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

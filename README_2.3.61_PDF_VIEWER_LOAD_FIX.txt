Snip 2.3.61 - PDF viewer load fix (changes vs 2.3.60: pdf.js, manifest version only)

ROOT CAUSE (reproduced in Chromium with the 2.3.60 build): the viewer iframe was loaded at init with
viewer.html?file=<pdf>#page=1. On the first search, ensurePdfViewer() assigned iframe.src to the same URL
with only the fragment changed (#page=N) and waited for an iframe 'load' event. A fragment-only change is a
same-document navigation and fires no 'load', so the 35 s timer always won ("Timed out while opening the PDF").
Cross-origin access was NOT the cause (reproduced with a CORS-enabled local PDF).

CHANGES
- Viewer is navigated once per PDF; page changes use the PDF.js API (no iframe.src reassign).
- waitForPdfDocument(): staged readiness (script -> initialized -> document opened -> pages created), fast
  failure when PDF.js's loading task rejects, timeout message names the stalled stage. One real reload retry.
- waitForTextLayer(): waits for the target page's text layer before searching.
- Success is reported only when a '.highlight.selected' span is actually rendered on the target page.
- Failure log keeps the query; open/search exceptions are shown to the user instead of a generic message.

NOT VERIFIED: the live M&S PDF and live backend (sandbox has no internet), persistence of highlight under
scrolling, web-page search/auth/payment flows (files unchanged but not run).

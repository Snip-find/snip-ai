Snip 2.3.68 — yellow highlight and more precise year-end targeting

Changes
- Changed PDF.js evidence highlights to soft yellow. Selected evidence is a slightly deeper yellow; forced-colors accessibility settings remain respected.
- Changed Snip's webpage evidence-highlight styling to soft yellow with a subtle amber outline.
- Improved financial-row label extraction so comma-separated figures and note codes such as C12 are removed from the highlight anchor. For example, "Cash and cash equivalents, C12, 683.3, 838.0" produces the label "Cash and cash equivalents".
- Added a narrow local context tie-breaker for questions explicitly asking about a year-end figure. It scans the already-built local PDF text index for repeated occurrences of the evidence label and prefers an occurrence on a page with strong primary-statement context (for example, "Statement of financial position"). Other questions retain backend-ranked evidence order.

Validation
- JavaScript syntax checks passed for background.js, content.js, pdf.js, web/viewer.js, build/pdf.js, and build/pdf.worker.js.
- manifest.json parsed and reports version 2.3.68.
- Focused regression tests passed for note/figure stripping, including the reported C12 row, and a prose false-positive guard.

Limits
- This was not tested end-to-end in Chrome with the live M&S PDF or deployed search API. The local context tie-breaker only works when the relevant label is present in the API evidence and the document text exposes useful primary-statement context. If the API omits the relevant label/evidence entirely, the extension cannot infer it from this patch alone.

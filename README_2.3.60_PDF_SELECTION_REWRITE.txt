Snip 2.3.60 — PDF.js selection rewrite fix

Changes from 2.3.59:
- Corrected the target-page selection bug: PDF.js 3.11 exposes `selected` as a getter-only property, so assigning to it did not change the actual selected match.
- Updates the bundled PDF.js 3.x internal selection state (`_selected`) only after verifying the expected structure exists.
- Dispatches the text-layer update from the find controller so PDF.js can refresh the intended page's highlight.
- Web-search code and backend API contract are unchanged.

Validation performed: JavaScript syntax checks, manifest JSON validation, ZIP integrity.
Not yet verified: live Chrome extension behavior, M&S FY25 PDF, other PDFs, or payment/auth flows. This is a concrete code fix for a confirmed selection-state defect, not a claim that every PDF highlighting issue is resolved.

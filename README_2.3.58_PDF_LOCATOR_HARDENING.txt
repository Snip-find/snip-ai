Snip 2.3.58 — PDF locator hardening

Based on the 2.3.57 package. This update does not replace the existing web locator or alter the backend API contract.

Changes:
- Keeps the PDF search request deadline active through response-body reading, not only until fetch headers arrive.
- Improves PDF text token normalization for zero-width/soft-hyphen characters, citation markers, and line-end hyphenation such as “inter- national”.
- Continues to prefer phrases taken from PDF.js extracted text when anchoring evidence, with evidence excerpts as fallback.
- Keeps the existing post-confirmed-highlight usage consumption behavior.

Checks completed in this package session:
- JavaScript syntax checks for pdf.js, content.js, background.js, and web/viewer.js.
- manifest.json parses successfully.
- ZIP integrity check passes.

Not yet runtime-verified: actual navigation/highlighting in Chrome on live PDFs, including the M&S FY25 report and scanned/table-heavy PDFs. Scanned PDFs without an accessible text layer may still require OCR support.

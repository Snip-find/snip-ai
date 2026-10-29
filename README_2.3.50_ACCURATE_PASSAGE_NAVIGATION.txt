Snip 2.3.50 — Accurate Passage Navigation Test

Based on the supplied 2.3.49 package.
- PDF matching tries multiple excerpts from the returned evidence passage to handle line wraps and hyphenation.
- PDF.js selected-match page index is checked against the backend evidence page before success is reported.
- PDF.js paints the text highlight; Snip does not claim success when the expected-page match cannot be confirmed.
- The regular webpage exact text-node anchoring logic is preserved; it highlights matched characters and scrolls the first confirmed passage into view.
- No public website source files were modified.

Checks: JavaScript syntax and ZIP integrity only. Real Chrome webpage/PDF navigation and highlighting must still be tested with actual documents.

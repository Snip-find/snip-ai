Snip 2.3.66 — local PDF text index and tighter table-label highlighting

Changes
- Reconstructs page text with line/word boundaries inferred from PDF.js item geometry instead of concatenating all separate text items; this prevents common split-item words from becoming a single token.
- Uses a new IndexedDB namespace so cached pages created by the older text-joining algorithm are not reused.
- Extracts each PDF page's selectable text and stores it in IndexedDB on the local device.
- Stores PDF.js text-item boundaries and coordinates (transform, width, height, direction) with each page record.
- Reuses cached page text when the PDF URL, PDF.js fingerprint, and page count match. A changed fingerprint/page count uses a new cache identity.
- Builds the page index during the first successful PDF search; repeat searches in the same viewer reuse the in-memory index, and reopening the same PDF can reuse IndexedDB.
- Prefers a label-only version of the backend quote before a label-plus-figure quote, and prefers nonnumeric/earlier phrase windows when generating PDF.js find queries.
- Uses a vivid turquoise-cyan PDF.js text-layer highlight instead of separate overlay rectangles.

Important limits
- Highlighting still relies on PDF.js native text-layer matching, not custom rectangles computed from stored item coordinates. Highly irregular layouts, duplicated labels, and malformed text layers can still produce a failed or imperfect match.
- This indexes selectable PDF text. OCR for image-only/scanned PDFs is not implemented in this build.
- The saved item coordinates are available in the local index but the highlight still uses PDF.js's native text-layer find/highlight mechanism; this build does not yet render custom coordinate-based rectangles.
- The backend question-to-evidence request is still used. This change caches PDF extraction and improves anchoring; it does not make Snip an offline semantic search engine.
- The exact live M&S PDF scenario has not been run in this environment. JavaScript syntax and archive integrity checks are not a substitute for Chrome end-to-end testing.

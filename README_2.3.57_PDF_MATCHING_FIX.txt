Snip 2.3.57 — PDF matching reliability patch

Changes in this build:
- Uses PDF.js getTextContent() to compare backend evidence with the PDF's own extracted page text.
- Searches the backend-reported page first, then other physical PDF pages to recover from printed-page/physical-page mismatches.
- Prefers a verbatim phrase sourced from the PDF text layer for the PDF.js highlight search; keeps excerpt fallback for paraphrased evidence.
- Caches extracted page text per loaded PDF document.
- Adds an overall 25-second timeout to the PDF API request.
- Prevents concurrent Enter/button searches from racing.
- Charges a search only after Snip confirms navigation/highlighting succeeded.
- Adds diagnostics for text extraction and phrase attempts.

Validation: run JavaScript syntax checks and ZIP integrity checks. This patch still needs a live Chrome test with representative PDFs before it can be described as runtime-verified.

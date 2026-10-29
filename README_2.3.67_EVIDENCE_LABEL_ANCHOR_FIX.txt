SNIP 2.3.67 — EVIDENCE-LABEL ANCHOR FIX

Change
- When the PDF evidence API omits its optional `quote` and returns a table row as the evidence passage, Snip now derives a label-only highlight anchor if the passage has multiple trailing numeric cells.
- This targets rows such as “Cash and cash equivalents 17 863.7 995.4” so the PDF.js search tries the label alone before a full-row query.
- Existing backend-provided quote behavior is preserved.

Important limits
- Question-to-passage retrieval still depends on the remote `/api/pdf-find` service. This extension ZIP cannot prove that live service correctly understands every natural-language question.
- Highlighting still uses PDF.js's native text-layer matching; it does not use the saved item coordinates to draw custom highlight rectangles.
- OCR for scanned/image-only PDFs is not implemented in this extension build.
- The exact 135-page M&S PDF has not been run end-to-end in Chrome in this environment.

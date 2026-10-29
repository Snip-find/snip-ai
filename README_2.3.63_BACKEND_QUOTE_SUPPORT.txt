Snip 2.3.63 - uses an optional `quote` field from /api/pdf-find (changes vs 2.3.62: pdf.js, manifest version only)

If an evidence item has `quote` (short verbatim label + figure), the extension anchors the PDF.js search on it first,
so only that line is highlighted. Without `quote` behaviour is unchanged from 2.3.62 (full-passage overlap phrase).
Verified in Chromium: quote cases highlight exactly "Cash and cash equivalents (see note 17) 863.7" on a spaced-table
PDF and an abutting-cell PDF; all earlier cases still pass. NOT verified on the live M&S PDF.

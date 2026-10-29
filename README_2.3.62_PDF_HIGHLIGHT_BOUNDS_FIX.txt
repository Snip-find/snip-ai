Snip 2.3.62 - highlight boundary fixes (changes vs 2.3.61: pdf.js, manifest version only)

Observed on the live M&S PDF with 2.3.61: viewer loads and highlights, but the highlight read
"and cash equivalents (see note 17)" + "863" (first word and the decimal part missing).
Log showed: pdf-text-overlap attempt (11 words) found:false, then evidence-excerpt fallback matched
"and cash equivalents (see note 17) 863.7".

CHANGES
- Fallback excerpt builder no longer drops the first word (or last word) when the slice is not actually cut
  mid-word (bug: .replace(/^\S+\s/, '') ran even at start=0, removing "Cash").
- Page text is built the way PDF.js's find controller builds it (items concatenated, newline at hasEOL),
  instead of trimming and space-joining items; avoids phrases like "17) 863.7" that cannot match
  "17)863.7" when adjacent table cells carry no space item.
- Overlap phrase cap raised 14 -> 20 words (a 14-word cap stopped before the figure in table rows).
- If the full phrase is not findable, up to 14 shorter word-boundary variants are tried, preferring
  windows that contain a figure, before any raw-excerpt fallback.
- phrase-attempt log now prints the actual query and failure reason as plain text.

NOT VERIFIED: the exact reason the 11-word phrase failed on the live M&S page (not reproduced locally);
the live M&S PDF with this build; the raw-excerpt fallback path (no local test reaches it now).
KNOWN LIMIT: the highlight is the longest phrase shared with the backend evidence, so it can include the
section heading; only a backend-provided short quote can narrow it to the single line.

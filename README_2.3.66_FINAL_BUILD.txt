SNIP 2.3.66 — FINAL BUILD PACKAGE

What is included
- Existing Snip webpage search, PDF evidence lookup, navigation, account/usage flow, and Ctrl+Shift+S shortcut.
- Bundled PDF.js viewer and worker.
- Local per-page PDF text index in IndexedDB, including original PDF.js text items and their coordinates/geometry.
- Geometry-aware reconstruction of text from separate PDF.js text items so common word boundaries remain searchable.
- A new index database namespace so text cached by the older reconstruction code is not reused.
- Turquoise-cyan native PDF.js selected-match highlighting.
- PDF highlighting attempts prefer a label-only quote before a longer quote containing note numbers and figures.

Verification performed in this build environment
- JavaScript syntax checks on extension scripts and bundled PDF.js files.
- Manifest JSON validation.
- A focused Node test of the actual text reconstruction helper with separate PDF.js text items; verified that “cash and cash equivalents” is reconstructed with word boundaries.
- ZIP integrity check after packaging.

Important limitations — please read
- This build has NOT been end-to-end tested in Chrome against the user's exact M&S PDF. Do not treat the focused text reconstruction test as proof that every PDF highlight is exact.
- OCR for scanned/image-only PDFs is not included. PDFs need a selectable text layer for indexing/search in this version.
- The backend PDF evidence endpoint is still required for question-to-passage selection; the local index supports text matching and caching, not offline semantic question answering.
- Saved item coordinates are retained, but final highlighting still uses PDF.js's native text-layer matching rather than custom coordinate-generated highlight rectangles. Complex tables or duplicate phrases may still fail or select an imperfect occurrence.
- The cache is scoped by source URL, PDF.js fingerprint, page count, and page number. If a host serves changed content with a reused fingerprint and same page count, cache invalidation cannot be guaranteed.

Install
1. Extract this ZIP into a new folder.
2. In Chrome, open chrome://extensions.
3. Enable Developer mode.
4. Choose “Load unpacked” and select the extracted folder containing manifest.json.
5. Test with a text-based PDF and then the M&S PDF. Confirm the selected phrase and figures are not included in the highlight unless they are part of the actual search phrase.

If Chrome already has an older Snip unpacked extension, use “Reload” on that extension after replacing its files, or load this build from a separate folder for a clean comparison.

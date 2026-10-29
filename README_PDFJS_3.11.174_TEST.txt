SNIP 2.3.42 — PDF.js 3.11.174 LEGACY COMPATIBILITY TEST BUILD

Changes
- Replaced PDF.js 6.4.299 module-based viewer/worker with the matching PDF.js 3.11.174 legacy distribution.
- Replaced the web/ viewer files and build/pdf.js, build/pdf.sandbox.js, build/pdf.worker.js together.
- Kept Snip's root popup, background, content script, manifest, API URLs, and existing product logic unchanged.
- This is a compatibility test build; it has not been tested in a live Chrome 109 session.

Testing
1. Extract to a new folder.
2. In chrome://extensions, disable the previous unpacked Snip build and Load unpacked from this folder.
3. Open the same PDF test case and ask a question expected to locate a known passage.
4. Confirm the viewer renders (not blank), page navigation works, and a matching passage highlights.
5. Test ordinary webpage Snip search separately.
6. Inspect the extension page DevTools console if the viewer fails.

Limitations
- Static package checks do not prove that remote PDFs permit extension-origin CORS access or that the backend returns correct page/evidence data.
- If PDF.js renders but highlighting fails, capture the console output and the selected page/evidence for the next targeted fix.
- PDF.js 3.11.174 is distributed under Apache License 2.0; retain the included LICENSE.

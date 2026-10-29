SNIP 2.3.43 — PDF.js 3.11.174 COMPATIBILITY TEST BUILD

What changed
- Bundles Mozilla PDF.js locally under web/ and build/ so the PDF viewer is controllable by Snip rather than relying on Chrome's native PDF viewer.
- Opens the selected PDF inside PDF.js and navigates to the page selected by the PDF search API.
- Uses PDF.js's text-search/highlight layer to search progressively shorter excerpts from the returned evidence passage. Delayed results for older queries are ignored when PDF.js identifies the query.
- Status only claims that a passage was highlighted when PDF.js reports a match on the selected evidence page.
- The existing web app and /api/find endpoint were not edited. The PDF popup continues to call the existing /api/pdf-find endpoint.
- Source PDF tabs are no longer changed in the background.

Important limitations
- This is a compatibility test build. Static archive and JavaScript syntax checks passed, but a live Chrome 109 session is still required to prove the M&S PDF loads, navigates, and highlights correctly.
- Remote PDFs must permit cross-origin access (CORS) for PDF.js to load them from the extension. If a host blocks CORS, PDF.js will report a load failure; that requires a separate permitted-fetch/proxy design.
- Highlighting searches the first 110 characters of the evidence passage. It only reports success if the match is confirmed on the page selected by the backend. If the evidence text differs too much from the PDF text layer, it tries shorter excerpts and reports that it could not confirm a match rather than claiming success.
- The manifest references four icon files; this package includes generated Snip placeholder icons so the manifest does not reference missing files. Replace these with final brand assets before store submission.
- This ZIP does not deploy or change the live Vercel backend. The deployed /api/pdf-find endpoint and billing/account/payment behavior are not end-to-end verified by this package.
- PDF.js is distributed under Apache License 2.0; see LICENSE.

Test in Chrome
1. Extract the ZIP into a NEW folder.
2. Open chrome://extensions, disable the old unpacked Snip version, click Load unpacked, and select the new folder containing manifest.json.
3. Open the M&S FY25 signed financial statements PDF and launch Snip.
4. Ask: “What was Marks & Spencer plc’s profit for the financial year ended 29 March 2025?”
5. Verify the embedded viewer opens page 92 and visibly highlights the matching text passage.
6. Ask: “How much cash and cash equivalents did the group have at 29 March 2025?”
7. Verify the embedded viewer opens the page returned by the API and highlights the matching passage.
8. Repeat with a different question/page. Confirm the ordinary web Snip popup still works as before.

If it fails
- Open the Snip PDF popup's DevTools console and look for [Snip PDF] search-error / search-finished messages.
- If PDF.js reports a CORS/network load failure, record the error; do not interpret an iframe load event as proof the PDF opened.
- Do not call this build launch-ready until those live tests pass.

Version: 2.3.43

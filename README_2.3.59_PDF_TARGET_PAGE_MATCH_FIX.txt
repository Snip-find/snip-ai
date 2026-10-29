Snip 2.3.59 — PDF target-page match selection

Based on 2.3.58. This is a focused PDF.js selection change; the web locator and backend API contract are unchanged.

Change:
- When PDF.js finds a phrase, check whether the intended evidence page has a matching occurrence. If so, select that occurrence on the intended page and ask PDF.js to update its selected match/highlight before confirming success. This addresses cases where PDF.js initially selects an identical phrase on a different page.
- Existing failure handling and no-charge behavior remain unchanged.

Static checks: JavaScript syntax, manifest JSON, and ZIP integrity.
Not yet verified: Chrome runtime highlighting on the M&S FY25 report or any other live PDF. This build must be tested before claiming the issue is fixed.

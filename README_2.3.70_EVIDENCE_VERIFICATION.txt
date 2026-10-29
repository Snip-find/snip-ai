Snip 2.3.70 — evidence verification hardening

Changes
- Before a financial table row can count as a successful match, compare its reported row label and numeric cells with the actual extracted text on the candidate PDF page. A label alone is not sufficient when the backend supplied numeric values.
- If the label is present but its numeric cells do not match nearby page text, reject that candidate and try the next ranked result.
- If evidence cannot be verified, do not report a successful highlight; show a clear failure message and do not consume a search.
- Retains yellow highlight and the prior local index/context-ranking logic.

Verification completed
- JavaScript syntax and manifest checks passed.
- Focused tests passed for matching financial values, mismatched values, and ordinary prose.
- ZIP integrity passed.

Limitations
- Chrome end-to-end with the live M&S PDF and deployed endpoint remains unverified.
- The remote search API still determines the initial semantic candidates. This patch verifies supplied financial-row values against the candidate PDF page; it does not guarantee perfect semantic ranking for all questions.

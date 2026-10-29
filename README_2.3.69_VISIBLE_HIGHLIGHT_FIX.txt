Snip 2.3.69 — visible yellow highlight fix

Change:
- Increased PDF.js text-layer opacity from 0.25 to 1. The text itself remains transparent, but highlight backgrounds are no longer dimmed by the parent text layer.
- Increased yellow highlight background contrast slightly.
- Retains v2.3.68 evidence-label targeting and year-end contextual reranking logic.

Verification:
- CSS source assertion passed: text-layer opacity is 1 and highlight colors are yellow.
- Manifest JSON validation and ZIP integrity checked.
- This does not establish Chrome end-to-end success. Test in Chrome on the same M&S PDF and verify the highlight is visibly yellow and on the intended row.

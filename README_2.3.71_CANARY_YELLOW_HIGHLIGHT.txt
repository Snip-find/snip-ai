Snip 2.3.71 — Canary yellow highlight

Changed PDF.js highlight colors to classic fluorescent/canary yellow (#FFFF00 / RGB 255,255,0):
- Normal highlight: rgba(255, 255, 0, 0.58)
- Selected highlight: rgba(255, 255, 0, 0.78)

This keeps the requested pure yellow hue while retaining transparency so PDF text remains readable. Retains the previous version's evidence-verification changes.

Verification performed: manifest JSON validation, CSS value assertions, and ZIP integrity check. Chrome end-to-end behavior has not been tested in this environment; please test on the same PDF.

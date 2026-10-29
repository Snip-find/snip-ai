Snip 2.3.71 — final fluorescent-yellow highlight build

Changes in this package:
- content.js: webpage highlight fill/outline changed to pure yellow RGB (255,255,0).
- web/viewer.css: PDF.js text-layer highlight colors set to pure yellow with readable transparency; selected highlight is more visible.
- Existing extension files and structure retained from the supplied 2.3.71 CANARY build.

Validation performed:
- JavaScript syntax check passed for content.js.
- ZIP integrity check passed.
- Highlight color assertions passed for content.js and web/viewer.css.

Note: These checks do not substitute for installing the unpacked extension in Chrome and visually testing it against representative PDFs.

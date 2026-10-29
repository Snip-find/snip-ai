Snip 2.3.55 — PDF cross-origin viewer fix

Fix: the bundled PDF.js viewer rejected external HTTP/HTTPS PDF URLs because its origin is the extension origin. The viewer now permits HTTP/HTTPS URLs for this intended embedded-PDF workflow while rejecting other cross-origin schemes.

Scope: only web/viewer.js URL validation and manifest version changed. No website files, popup UI, login, subscription, payment, or usage logic changed.

Verification performed: JavaScript syntax check, manifest JSON parse, ZIP integrity test, and diff scope check. Live Chrome extension runtime and the Marks & Spencer PDF still require browser verification.

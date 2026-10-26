# Snip API and public website

This repository contains Snip's serverless search endpoints and public website.

## API configuration

Set `OPENAI_API_KEY` in the hosting provider's secret/environment-variable settings for AI-assisted searches. Do not commit the key or put it in client-side extension code.

`api/find.js` searches supplied webpage/document text. `api/pdf-find.js` fetches a public PDF URL, extracts readable text, and returns source evidence with its PDF page number. The extractor attempts to preserve visual reading order and separate multi-column text, but PDF layouts vary and extraction quality depends on the source file. For scanned/image-only PDFs, OCR is optional and disabled by default. To enable it, set `SNIP_OCR_SPACE_API_KEY` in the hosting provider's environment settings. When enabled, PDFs with one or more pages that have no extractable text are sent to OCR.space at `https://api.ocr.space/parse/image`; this sends document contents to that third-party service, so enable it only if that processing is acceptable for your users and documents. Without the key, scanned PDFs receive a clear unsupported/configuration message. OCR service limits and recognition errors can still affect results.


## PDF fetch security

The PDF endpoint rejects non-public IP literals and special-use IPv4/IPv6 destinations, refuses credential-bearing URLs, validates each redirect, and pins outbound connections to DNS answers that have been checked as public. If any DNS answer is private or otherwise disallowed, the request is rejected rather than choosing only the public answer. Automated tests cover loopback/private addresses, special-use IPv6 ranges, mixed public/private DNS answers, redirect validation, and a permitted global IPv6 address.

These checks reduce server-side request forgery risk; they are not a substitute for reviewing hosting-network egress controls and monitoring before production rollout.

## Tests

Install the dependencies and run the automated suite:

```sh
npm install
npm test
```

The M&S FY2025 PDF integration test is opt-in so the report is not committed to the repository. Its expected answer, exact source quote, physical PDF page, and page count must be verified for the specific report edition being tested; page numbers and amounts must not be copied from another edition.

Set all six environment variables, then run `npm test`:

```sh
SNIP_MS_PDF_PATH=/path/to/verified-report.pdf \
SNIP_MS_EXPECTED_ANSWER='<verified amount from the primary statement>' \
SNIP_MS_EXPECTED_PERIOD='<verified reporting date>' \
SNIP_MS_EXPECTED_QUOTE='<exact row copied from the primary statement>' \
SNIP_MS_EXPECTED_PAGE=REPLACE_WITH_PHYSICAL_PAGE_NUMBER \
SNIP_MS_EXPECTED_PAGE_COUNT=REPLACE_WITH_PHYSICAL_PAGE_COUNT \
npm test
```

Replace every placeholder with values verified against that exact PDF. Do not use the amount or page from a reconciliation table as the expected primary-statement result. The integration test is skipped unless the file path and all expected values are supplied.
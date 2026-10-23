# Snip API and public website

This repository contains Snip's serverless search endpoints and public website.

## API configuration

Set `OPENAI_API_KEY` in the hosting provider's secret/environment-variable settings for AI-assisted searches. Do not commit the key or put it in client-side extension code.

`api/find.js` searches supplied webpage/document text. `api/pdf-find.js` fetches a public PDF URL, extracts readable text, and returns source evidence with its PDF page number. Scanned PDFs are not OCR'd.

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
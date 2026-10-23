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

The M&S FY2025 PDF integration test is opt-in so the report is not committed to the repository. Download the official report to a local file, then run:

```sh
SNIP_MS_PDF_PATH=/path/to/marks-and-spencer-fy2025-report.pdf npm test
```

That integration test verifies the cash-and-cash-equivalents lookup returns £864.5m for 29 March 2025, quotes the row from the consolidated statement of financial position, and points to PDF page 126 rather than the net-debt/reconciliation tables.
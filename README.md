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
SNIP_MS_EXPECTED_ANSWER='£863.7m' \
SNIP_MS_EXPECTED_PERIOD='29 March 2025' \
SNIP_MS_EXPECTED_QUOTE='paste the exact cash row from the verified PDF' \
SNIP_MS_EXPECTED_PAGE=90 \
SNIP_MS_EXPECTED_PAGE_COUNT=135 \
npm test
```

The example values above reflect the previously reported test document and must be checked against the exact PDF file before use. The integration test is skipped unless the file path and all expected values are supplied.
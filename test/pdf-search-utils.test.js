import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyFinancialSection,
  extractFinancialRows,
  extractPageLines,
  selectPrimaryFinancialEvidence
} from "../api/pdf-search-utils.js";

test("extractPageLines preserves visual row and column order", () => {
  const lines = extractPageLines([
    { str: "1,022.4", transform: [1, 0, 0, 1, 320, 100] },
    { str: "Cash and cash equivalents", transform: [1, 0, 0, 1, 40, 100] },
    { str: "Prior period", transform: [1, 0, 0, 1, 40, 80] }
  ]);

  assert.deepEqual(lines, [
    "Cash and cash equivalents 1,022.4",
    "Prior period"
  ]);
});

test("classifies consolidated primary statements separately from reconciliations", () => {
  assert.equal(
    classifyFinancialSection("CONSOLIDATED STATEMENT OF FINANCIAL POSITION\nCash and cash equivalents 18 864.5 1,022.4"),
    "Primary consolidated statement of financial position"
  );
  assert.equal(
    classifyFinancialSection("B. Reconciliation of net debt to statement of financial position\nCash and cash equivalents 864.5 1,022.4"),
    "Reconciliation"
  );
});

test("M&S-style FY2025 cash query selects the primary consolidated statement and requested period", () => {
  const pages = [
    {
      page: 32,
      text: [
        "FINANCIAL REVIEW CONTINUED",
        "The composition of Group net debt is as follows:",
        "Cash and cash equivalents 1 864.5 1,022.4 (157.9)"
      ].join("\n")
    },
    {
      page: 126,
      text: [
        "CONSOLIDATED STATEMENT OF FINANCIAL POSITION",
        "As at As at As at As at",
        "29 March 30 March 29 March 30 March",
        "2025 2024 2025 2024",
        "Notes £m £m Notes £m £m",
        "Cash and cash equivalents 18 864.5 1,022.4"
      ].join("\n")
    },
    {
      page: 181,
      text: [
        "B. Reconciliation of net debt to statement of financial position",
        "2025 2024 £m £m",
        "Cash and cash equivalents (see note 18) 864.5 1,022.4"
      ].join("\n")
    }
  ];
  const rows = pages.flatMap(({ page, text }, index) =>
    extractFinancialRows(text, page, index * 10)
  );

  const result = selectPrimaryFinancialEvidence(
    "What were cash and cash equivalents for FY2025?",
    rows
  );

  assert.ok(result);
  assert.equal(result.answer, "£864.5m");
  assert.equal(result.period, "29 March 2025");
  assert.equal(result.row.page, 126);
  assert.equal(result.row.section, "Primary consolidated statement of financial position");
  assert.equal(result.sourceQuote, "Cash and cash equivalents 18 864.5 1,022.4");
});

test("period selection uses the requested comparative year", () => {
  const rows = extractFinancialRows([
    "CONSOLIDATED STATEMENT OF FINANCIAL POSITION",
    "As at As at",
    "29 March 30 March",
    "2025 2024",
    "Notes £m £m",
    "Cash and cash equivalents 18 864.5 1,022.4"
  ].join("\n"), 126);

  const result = selectPrimaryFinancialEvidence(
    "What were cash and cash equivalents in FY2024?",
    rows
  );

  assert.equal(result?.answer, "£1,022.4m");
  assert.equal(result?.period, "30 March 2024");
});

test("does not use a reconciliation when no primary statement row exists", () => {
  const rows = extractFinancialRows([
    "B. Reconciliation of net debt to statement of financial position",
    "2025 2024 £m £m",
    "Cash and cash equivalents 864.5 1,022.4"
  ].join("\n"), 181);

  assert.equal(
    selectPrimaryFinancialEvidence("Cash and cash equivalents FY2025", rows),
    null
  );
});

test("does not short-circuit explanatory or movement questions to a statement row", () => {
  const rows = extractFinancialRows([
    "CONSOLIDATED STATEMENT OF FINANCIAL POSITION",
    "As at As at",
    "29 March 30 March",
    "2025 2024",
    "Notes £m £m",
    "Cash and cash equivalents 18 864.5 1,022.4"
  ].join("\n"), 126);

  assert.equal(
    selectPrimaryFinancialEvidence("Why did cash and cash equivalents change?", rows),
    null
  );
});

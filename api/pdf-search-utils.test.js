import test from "node:test";
import assert from "node:assert/strict";
import {
  extractFinancialRows,
  selectPrimaryFinancialEvidence
} from "./pdf-search-utils.js";

const statementPage = [
  "Consolidated statement of financial position",
  "As at 29 March 2025 As at 30 March 2024 £m",
  "Cash and cash equivalents 863.7 999.9"
].join("\n");

function rowsFromStatement() {
  return extractFinancialRows(statementPage, 40);
}

test("selects the value under an explicitly requested reporting date", () => {
  const rows = rowsFromStatement();
  const result = selectPrimaryFinancialEvidence(
    "What is the cash and cash equivalents figure in the Statement of Financial Position at 30 March 2024?",
    rows
  );

  assert.ok(result);
  assert.equal(result.answer, "999.9");
  assert.equal(result.period, "30 March 2024");
});

test("selects the exact requested date rather than the first date in the table", () => {
  const rows = rowsFromStatement();
  const result = selectPrimaryFinancialEvidence(
    "What is cash and cash equivalents at 29 March 2025 in the statement of financial position?",
    rows
  );

  assert.ok(result);
  assert.equal(result.answer, "863.7");
  assert.equal(result.period, "29 March 2025");
});

test("fails closed when the requested reporting date is not present", () => {
  const result = selectPrimaryFinancialEvidence(
    "What is cash and cash equivalents at 31 March 2023 in the statement of financial position?",
    rowsFromStatement()
  );

  assert.equal(result, null);
});

test("preserves negative values represented in parentheses", () => {
  const rows = extractFinancialRows([
    "Consolidated statement of financial position",
    "As at 29 March 2025 As at 30 March 2024 £m",
    "Cash and cash equivalents (863.7) 999.9"
  ].join("\n"), 40);

  const result = selectPrimaryFinancialEvidence(
    "What is cash and cash equivalents at 29 March 2025 in the statement of financial position?",
    rows
  );

  assert.ok(result);
  assert.equal(result.answer, "£-863.7m");
});

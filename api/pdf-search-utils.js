const FINANCIAL_LABELS = [
  "cash and cash equivalents at beginning and end of year",
  "cash and cash equivalents",
  "total comprehensive income",
  "profit before tax",
  "profit for the year",
  "operating profit",
  "total liabilities",
  "total assets",
  "net assets",
  "revenue",
  "turnover"
];

const MONTH_PATTERN =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

function cleanLine(value) {
  return String(value || "")
    .replace(/\u00ad/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalized(value) {
  return cleanLine(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

export function extractPageLines(items) {
  const rows = [];
  const fallback = [];

  for (const item of Array.isArray(items) ? items : []) {
    const text = cleanLine(item?.str);
    if (!text) continue;

    const x = Number(item?.transform?.[4]);
    const y = Number(item?.transform?.[5]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      fallback.push(text);
      continue;
    }

    let row = rows.find(candidate => Math.abs(candidate.y - y) < 1.5);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, text });
  }

  if (!rows.length) return fallback;

  const positioned = rows
    .sort((a, b) => b.y - a.y)
    .map(row =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map(item => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  return fallback.length ? [...positioned, ...fallback] : positioned;
}

export function classifyFinancialSection(pageText) {
  const lines = String(pageText || "")
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
  const text = lines.join("\n");

  if (/reconciliation of net debt|statement of financial position and related notes/i.test(text)) {
    return "Reconciliation";
  }

  if (/financial review|composition of group net debt/i.test(text)) {
    return "Financial review";
  }

  if (/^\s*(?:consolidated|group)\s+(?:statement of financial position|balance sheet)(?:\s+continued)?\s*$/im.test(text)) {
    return "Primary consolidated statement of financial position";
  }

  if (/^\s*(?:company|parent company)\s+(?:statement of financial position|balance sheet)(?:\s+continued)?\s*$/im.test(text)) {
    return "Primary company statement of financial position";
  }

  return "Other";
}

function periodHeader(lines, headingPattern) {
  const headingIndex = lines.findIndex(line => headingPattern.test(line));
  if (headingIndex < 0) return "";

  return lines
    .slice(headingIndex + 1, headingIndex + 8)
    .filter(line =>
      /\b20\d{2}\b|£m|€m|\bas at\b|\bended\b|\bweeks?\b/i.test(line) ||
      new RegExp(`\\b${MONTH_PATTERN}\\b`, "i").test(line)
    )
    .join(" | ");
}

function periodsFromHeader(header) {
  const years = [...String(header).matchAll(/\b20\d{2}\b/g)].map(match => match[0]);
  const dates = [...String(header).matchAll(new RegExp(`\\b\\d{1,2}\\s+${MONTH_PATTERN}\\b`, "gi"))]
    .map(match => match[0]);
  const periods = [];
  const seen = new Set();

  for (let index = 0; index < Math.min(years.length, dates.length); index += 1) {
    const period = `${dates[index]} ${years[index]}`;
    if (!seen.has(period)) {
      seen.add(period);
      periods.push(period);
    }
  }

  if (!periods.length) {
    for (const year of years) {
      if (!seen.has(year)) {
        seen.add(year);
        periods.push(year);
      }
    }
  }

  return periods;
}

export function extractFinancialRows(pageText, page, indexOffset = 0) {
  const lines = String(pageText || "")
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
  const section = classifyFinancialSection(lines.join("\n"));

  if (!section.startsWith("Primary ")) return [];

  const headingPattern = section.includes("company")
    ? /^\s*(?:company|parent company)\s+(?:statement of financial position|balance sheet)(?:\s+continued)?\s*$/i
    : /^\s*(?:consolidated|group)\s+(?:statement of financial position|balance sheet)(?:\s+continued)?\s*$/i;
  const context = periodHeader(lines, headingPattern);
  const rows = [];

  for (const line of lines) {
    const lineText = normalized(line);
    const label = FINANCIAL_LABELS.find(candidate =>
      lineText === candidate || lineText.startsWith(`${candidate} `)
    );
    if (!label) continue;

    const remainder = lineText.slice(label.length);
    if (!/[\d—–-]/.test(remainder)) continue;

    const index = indexOffset + rows.length;
    rows.push({
      id: `pdf-${page}-${index}`,
      index,
      label,
      text: line,
      page,
      section,
      periodContext: context
    });
  }

  return rows;
}

function requestedFinancialLabel(question) {
  const q = normalized(question);
  if (/\b(?:why|explain|definition|define|meaning|reconciliation|reconcile|movement|change|changed|caused|how did|what drove)\b/.test(q)) {
    return null;
  }

  return FINANCIAL_LABELS.find(label => q.includes(label)) || null;
}

export function isCashPositionLookup(question) {
  return requestedFinancialLabel(question) === "cash and cash equivalents";
}

function requestedYear(question) {
  return String(question || "").match(/\b(?:FY|financial year|fiscal year|year ended|year ending|as at|for|in)?\s*(20\d{2})\b/i)?.[1] || null;
}

function valuesFromRow(row) {
  const start = normalized(row.text).indexOf(row.label) + row.label.length;
  const tail = row.text.slice(start);
  return [...tail.matchAll(/(?:\(\s*[\d,]+(?:\.\d+)?\s*\)|-?\s*[\d,]+(?:\.\d+)?|[—–])/g)]
    .map(match => match[0].replace(/\s+/g, "").trim());
}

function formatAnswer(value, header) {
  if (!value) return null;
  if (/^[—–-]$/.test(value)) return value;
  if (/£m\b/i.test(header)) return `£${value.replace(/^\(/, "-").replace(/\)$/, "")}m`;
  if (/€m\b/i.test(header)) return `€${value.replace(/^\(/, "-").replace(/\)$/, "")}m`;
  if (/\$m\b/i.test(header)) return `$${value.replace(/^\(/, "-").replace(/\)$/, "")}m`;
  return value;
}

export function selectPrimaryFinancialEvidence(question, rows) {
  const label = requestedFinancialLabel(question);
  if (!label) return null;

  const candidates = (Array.isArray(rows) ? rows : [])
    .filter(row => row.label === label)
    .filter(row => row.section?.startsWith("Primary "));
  if (!candidates.length) return null;

  const wantsCompany = /\b(?:company|parent company|parent entity)\b/i.test(question);
  const preferredSection = wantsCompany
    ? "Primary company statement of financial position"
    : "Primary consolidated statement of financial position";
  const preferred = candidates.filter(row => row.section === preferredSection);
  let ranked = preferred.length ? preferred : candidates;

  const year = requestedYear(question);
  if (year) {
    const matchingYear = ranked.filter(row =>
      periodsFromHeader(row.periodContext).some(period => period.includes(year))
    );
    if (!matchingYear.length) return null;
    ranked = matchingYear;
  }

  ranked.sort((a, b) => a.page - b.page || a.index - b.index);
  const row = ranked[0];
  const periods = periodsFromHeader(row.periodContext);
  const years = periods.map(period => period.match(/\b20\d{2}\b/)?.[0]).filter(Boolean);
  const values = valuesFromRow(row);
  const columnCount = Math.min(periods.length, values.length);
  const periodValues = columnCount ? values.slice(-columnCount) : values;
  const selectedYear = year || years[0] || null;
  const valueIndex = selectedYear ? years.indexOf(selectedYear) : 0;
  if (valueIndex < 0 || valueIndex >= periodValues.length) return null;

  const period = periods[valueIndex] || (selectedYear ? `FY${selectedYear}` : null);
  const answer = formatAnswer(periodValues[valueIndex], row.periodContext);
  if (!answer) return null;

  return {
    answer,
    period,
    sourceQuote: row.text,
    row
  };
}

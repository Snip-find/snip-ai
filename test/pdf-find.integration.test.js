import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const { default: pdfFindHandler, publicDnsLookup, createPublicDnsLookup, extractScannedPdfPages } = await import("../api/pdf-find.js");

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    }
  };
}


function createTextPdf() {
  // Generate a valid classic-xref PDF at runtime so offsets are calculated from
  // the exact bytes passed to pdf-parse (including the WinAnsi pound sign).
  const escapePdf = value => String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/£/g, "\\243");
  const lines = [
    "Consolidated statement of financial position",
    "As at 29 March 2025 As at 30 March 2024 £m",
    "Cash and cash equivalents 863.7 999.9"
  ];
  const commands = ["BT", "/F1 11 Tf", "50 760 Td"];
  lines.forEach((line, index) => {
    if (index) commands.push("0 -18 Td");
    commands.push("(" + escapePdf(line) + ") Tj");
  });
  commands.push("ET");
  const stream = commands.join("\\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Length " + Buffer.byteLength(stream, "ascii") + " >>\\nstream\\n" + stream + "\\nendstream"
  ];
  let pdf = "%PDF-1.4\\n%âãÏÓ\\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += (i + 1) + " 0 obj\\n" + objects[i] + "\\nendobj\\n";
  }
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += "xref\\n0 " + (objects.length + 1) + "\\n0000000000 65535 f \\n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \\n";
  }
  pdf += "trailer\\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\\nstartxref\\n" + xrefOffset + "\\n%%EOF";
  return Buffer.from(pdf, "binary");
}

test("PDF endpoint extracts a real PDF fixture and returns exact-page financial evidence without OpenAI", async () => {
  const pdfBytes = createTextPdf()
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(pdfBytes, {
    status: 200,
    headers: { "content-type": "application/pdf" }
  });
  try {
    const response = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: {
        url: "https://reports.example.test/synthetic-report.pdf",
        question: "What were cash and cash equivalents at 30 March 2024 in the consolidated statement of financial position?"
      },
      headers: {}
    }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, "£999.9m");
    assert.equal(response.body.period, "30 March 2024");
    assert.equal(response.body.evidence[0].page, 1);
    assert.match(response.body.sourceQuote, /Cash and cash equivalents/);
    assert.equal(response.body.pageCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const msExpected = {
  answer: process.env.SNIP_MS_EXPECTED_ANSWER,
  period: process.env.SNIP_MS_EXPECTED_PERIOD,
  quote: process.env.SNIP_MS_EXPECTED_QUOTE,
  page: Number(process.env.SNIP_MS_EXPECTED_PAGE),
  pageCount: Number(process.env.SNIP_MS_EXPECTED_PAGE_COUNT)
};
const msFixtureConfigured = Boolean(
  process.env.SNIP_MS_PDF_PATH &&
  msExpected.answer &&
  msExpected.period &&
  msExpected.quote &&
  Number.isInteger(msExpected.page) && msExpected.page > 0 &&
  Number.isInteger(msExpected.pageCount) && msExpected.pageCount > 0
);

test("PDF endpoint answers the M&S FY2025 cash question from the primary statement", {
  // A real PDF must be supplied with its verified expected values. Avoid stale
  // page/value assertions that could accidentally validate a different report edition.
  skip: !msFixtureConfigured
}, async () => {
  const pdfBytes = fs.readFileSync(process.env.SNIP_MS_PDF_PATH);
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(pdfBytes, {
      status: 200,
      headers: { "content-type": "application/pdf" }
    });
  };

  try {
    const response = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: {
        url: "https://reports.example.test/ms-fy2025.pdf",
        question: "What were cash and cash equivalents for FY2025 in the consolidated statement of financial position?"
      },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, msExpected.answer);
    assert.equal(response.body.period, msExpected.period);
    assert.equal(response.body.sourceQuote, msExpected.quote);
    assert.equal(response.body.evidence[0].section, "Primary consolidated statement of financial position");
    assert.equal(response.body.evidence[0].page, msExpected.page);
    assert.equal(response.body.evidence[0].quote, response.body.sourceQuote);
    assert.equal(response.body.pageCount, msExpected.pageCount);

    const absentPeriod = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: {
        url: "https://reports.example.test/ms-fy2025.pdf",
        question: "What were cash and cash equivalents in the FY2026 consolidated statement of financial position?"
      },
      headers: {}
    }, absentPeriod);

    assert.equal(absentPeriod.statusCode, 200);
    assert.equal(absentPeriod.body.answer, null);
    assert.deepEqual(absentPeriod.body.evidence, []);
    assert.equal(fetchCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("PDF preflight advertises cross-origin POST support without fetching a PDF", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Preflight must not fetch a document");
  };

  try {
    const response = createResponse();
    await pdfFindHandler({ method: "OPTIONS", headers: {} }, response);

    assert.equal(response.statusCode, 204);
    assert.equal(response.headers["Access-Control-Allow-Origin"], "*");
    assert.equal(response.headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
    assert.equal(response.headers["Access-Control-Max-Age"], "86400");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects private and special-use IPv4/IPv6 targets and credential-bearing URLs before fetching", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => { fetchCount += 1; throw new Error("Unsafe URL must not be fetched"); };
  try {
    for (const url of [
      "http://[fc00::1]/secret.pdf",
      "http://[fe80::1]/secret.pdf",
      "http://[::ffff:172.16.0.1]/secret.pdf",
      "http://[2001:2::1]/benchmark.pdf",
      "http://[2001:db8::1]/documentation.pdf",
      "http://[2002:7f00:1::]/6to4.pdf",
      "http://127.0.0.1/private.pdf",
      "http://192.88.99.1/6to4-relay.pdf",
      "http://user:pass@example.com/report.pdf"
    ]) {
      const response = createResponse();
      await pdfFindHandler({ method: "POST", body: { url, question: "What is the answer?" }, headers: {} }, response);
      assert.equal(response.statusCode, 400, url);
    }
    assert.equal(fetchCount, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("validates redirect targets before fetching them", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async url => {
    requested.push(String(url));
    return new Response(null, { status: 302, headers: { location: "http://[fc00::1]/internal.pdf" } });
  };
  try {
    const response = createResponse();
    await pdfFindHandler({ method: "POST", body: { url: "https://public.example/report.pdf", question: "What is the answer?" }, headers: {} }, response);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(requested, ["https://public.example/report.pdf"]);
  } finally { globalThis.fetch = originalFetch; }
});


test("DNS lookup rejects hostnames resolving to loopback or private addresses", async () => {
  await new Promise(resolve => {
    publicDnsLookup("localhost", {}, error => {
      assert.ok(error, "localhost must not resolve as a permitted public PDF host");
      assert.match(error.message, /non-public network address/);
      resolve();
    });
  });
});


test("DNS guard rejects a public-looking hostname with any private DNS answer", async () => {
  const lookup = createPublicDnsLookup((_hostname, _options, callback) => {
    callback(null, [
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 }
    ]);
  });
  await new Promise(resolve => {
    lookup("mixed-answer.example", {}, error => {
      assert.ok(error);
      assert.match(error.message, /non-public network address/);
      resolve();
    });
  });
});

test("DNS guard returns the same validated public addresses for connection pinning", async () => {
  const expected = [
    { address: "93.184.216.34", family: 4 },
    { address: "2606:4700:4700::1111", family: 6 }
  ];
  const lookup = createPublicDnsLookup((_hostname, _options, callback) => callback(null, expected));
  await new Promise((resolve, reject) => {
    lookup("public.example", { all: true }, (error, addresses) => {
      if (error) return reject(error);
      assert.deepEqual(addresses, expected);
      resolve();
    });
  });
});


test("allows a globally routable IPv6 PDF URL through URL validation", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response("not a PDF", { status: 200, headers: { "content-type": "text/plain" } });
  };
  try {
    const response = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: { url: "https://[2606:4700:4700::1111]/report.pdf", question: "What is the answer?" },
      headers: {}
    }, response);
    assert.equal(fetchCount, 1);
    assert.equal(response.statusCode, 415);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("OCR extraction preserves physical page slots, including pages with no recognized text", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SNIP_OCR_SPACE_API_KEY;
  process.env.SNIP_OCR_SPACE_API_KEY = "test-ocr-key";
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: String(url), options };
    return new Response(JSON.stringify({
      IsErroredOnProcessing: false,
      ParsedResults: [
        { ParsedText: "First scanned page text" },
        { ParsedText: "" },
        { ParsedText: "Third scanned page text" }
      ]
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const pages = await extractScannedPdfPages(Buffer.from("%PDF-test"), new AbortController().signal);
    assert.equal(request.url, "https://api.ocr.space/parse/image");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers.apikey, "test-ocr-key");
    assert.deepEqual(pages, [
      { page: 1, text: "First scanned page text" },
      { page: 2, text: "" },
      { page: 3, text: "Third scanned page text" }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SNIP_OCR_SPACE_API_KEY;
    else process.env.SNIP_OCR_SPACE_API_KEY = originalKey;
  }
});

test("OCR extraction is disabled without an explicit API key", async () => {
  const originalKey = process.env.SNIP_OCR_SPACE_API_KEY;
  const originalFetch = globalThis.fetch;
  delete process.env.SNIP_OCR_SPACE_API_KEY;
  globalThis.fetch = async () => { throw new Error("OCR must not run without opt-in"); };
  try {
    assert.equal(await extractScannedPdfPages(Buffer.from("%PDF-test"), new AbortController().signal), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SNIP_OCR_SPACE_API_KEY;
    else process.env.SNIP_OCR_SPACE_API_KEY = originalKey;
  }
});

test("OCR extraction reports provider processing errors clearly", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SNIP_OCR_SPACE_API_KEY;
  process.env.SNIP_OCR_SPACE_API_KEY = "test-ocr-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    IsErroredOnProcessing: true,
    ErrorMessage: ["Invalid PDF"]
  }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    await assert.rejects(
      extractScannedPdfPages(Buffer.from("%PDF-test"), new AbortController().signal),
      error => error.statusCode === 422 && /Invalid PDF/.test(error.message)
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SNIP_OCR_SPACE_API_KEY;
    else process.env.SNIP_OCR_SPACE_API_KEY = originalKey;
  }
});

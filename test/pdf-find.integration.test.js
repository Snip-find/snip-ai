import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const { default: pdfFindHandler } = await import("../api/pdf-find.js");

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

test("PDF endpoint answers the M&S FY2025 cash question from the primary statement", {
  skip: !process.env.SNIP_MS_PDF_PATH
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
        question: "Cash and cash equivalents"
      },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, "£864.5m");
    assert.equal(response.body.period, "29 March 2025");
    assert.match(response.body.sourceQuote, /^Cash and cash equivalents\s+18\s+864\.5\s+1,022\.4$/);
    assert.equal(response.body.evidence[0].section, "Primary consolidated statement of financial position");
    assert.equal(response.body.evidence[0].page, 126);
    assert.equal(response.body.pageCount, 224);

    const absentPeriod = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: {
        url: "https://reports.example.test/ms-fy2025.pdf",
        question: "What were cash and cash equivalents in the FY2026 financial statements?"
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

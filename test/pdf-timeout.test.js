import assert from "node:assert/strict";
import test from "node:test";

process.env.SNIP_PDF_TIMEOUT_MS = "30";
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

test("PDF download timeout returns 504", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  console.error = () => {};
  globalThis.fetch = async (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => {
      reject(new Error("fetch aborted"));
    }, { once: true });
  });

  try {
    const response = createResponse();
    await pdfFindHandler({
      method: "POST",
      body: { url: "https://reports.example.test/slow.pdf", question: "Find the answer" },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 504);
    assert.match(response.body.error, /took too long/i);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

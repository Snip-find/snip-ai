import assert from "node:assert/strict";
import test from "node:test";

process.env.OPENAI_API_KEY = "test-only";
process.env.SNIP_OPENAI_TIMEOUT_MS = "30";
const { default: findHandler } = await import("../api/find.js");

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

test("OpenAI timeout falls back to source-matched evidence", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  console.error = () => {};
  globalThis.fetch = async (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => {
      reject(new Error("request aborted"));
    }, { once: true });
  });

  try {
    const response = createResponse();
    const source = "Cash and cash equivalents were £864.5m at 29 March 2025.";
    await findHandler({
      method: "POST",
      body: {
        question: "What were cash and cash equivalents in FY2025?",
        blocks: [{ index: 0, id: "source", text: source, section: "PDF page 126", page: 126 }]
      },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.evidence[0].passage, source);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

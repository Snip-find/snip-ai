import assert from "node:assert/strict";
import test from "node:test";

process.env.OPENAI_API_KEY ||= "test-only";
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

test("shortened model quote is rejected and the source sentence is returned", async () => {
  const originalFetch = globalThis.fetch;
  const source = "Cash and cash equivalents 18 864.5 1,022.4";
  globalThis.fetch = async () => new Response(JSON.stringify({
    output_text: JSON.stringify({
      evidence: [{ block_index: 0, passage: "Cash and cash equivalents 18 864.5" }]
    })
  }), { status: 200, headers: { "content-type": "application/json" } });

  try {
    const response = createResponse();
    await findHandler({
      method: "POST",
      body: {
        question: "What were cash and cash equivalents for FY2025?",
        blocks: [{ index: 0, id: "source", text: source, section: "PDF page 126", page: 126 }]
      },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.evidence[0].passage, source);
    assert.equal(response.body.evidence[0].page, 126);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unrelated searches return no deterministic evidence", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    output_text: JSON.stringify({ evidence: [] })
  }), { status: 200, headers: { "content-type": "application/json" } });

  try {
    const response = createResponse();
    await findHandler({
      method: "POST",
      body: {
        question: "What is the meaning of the third instrument?",
        blocks: [{ index: 0, id: "unrelated", text: "The report describes its financial position at year end.", page: 4 }]
      },
      headers: {}
    }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.evidence, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

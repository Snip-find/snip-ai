import pdfParse from "pdf-parse/lib/pdf-parse.js";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const TIMEOUT_MS = 25000;

function unsafeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!["http:", "https:"].includes(u.protocol)) return true;
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return h === "localhost" || h === "::1" || h === "0.0.0.0" ||
      h.endsWith(".local") || h === "metadata.google.internal" ||
      /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
      /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^::ffff:(?:127\.|10\.|192\.168\.)/i.test(h);
  } catch { return true; }
}

function errorStatus(error, fallback = 500) {
  return Number.isInteger(error?.statusCode) ? error.statusCode : fallback;
}

async function readLimited(response, controller) {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_PDF_BYTES) {
    controller.abort();
    const e = new Error("This PDF is too large for Snip right now (15 MB maximum).");
    e.statusCode = 413;
    throw e;
  }
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_PDF_BYTES) {
      const e = new Error("This PDF is too large for Snip right now (15 MB maximum).");
      e.statusCode = 413;
      throw e;
    }
    return bytes;
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    const b = Buffer.from(chunk);
    total += b.length;
    if (total > MAX_PDF_BYTES) {
      controller.abort();
      const e = new Error("This PDF is too large for Snip right now (15 MB maximum).");
      e.statusCode = 413;
      throw e;
    }
    chunks.push(b);
  }
  return Buffer.concat(chunks, total);
}

function toBlocks(text, page) {
  const clean = String(text || "").replace(/\u00ad/g, "").replace(/[ \t]+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map(s => s.trim()).filter(s => s.length >= 15);
  const result = [];
  let buffer = "";
  for (const part of parts) {
    if (!buffer) buffer = part;
    else if ((buffer + " " + part).length <= 1800) buffer += " " + part;
    else { result.push(buffer); buffer = part; }
  }
  if (buffer) result.push(buffer);
  return result.map(text => ({ text, page }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const question = String(req.body?.question || "").trim();
    const url = String(req.body?.url || "").trim();
    if (!question) return res.status(400).json({ error: "Question is required." });
    if (!url || unsafeUrl(url)) return res.status(400).json({ error: "A public PDF URL is required." });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response, bytes;
    try {
      response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: { Accept: "application/pdf,*/*;q=0.8", "User-Agent": "Snip PDF reader" }
      });
      if (!response.ok) {
        const e = new Error(`Could not download the PDF (${response.status}).`);
        e.statusCode = 502;
        throw e;
      }
      if (response.url && unsafeUrl(response.url)) {
        const e = new Error("The PDF URL redirected to an unsupported address.");
        e.statusCode = 400;
        throw e;
      }
      bytes = await readLimited(response, controller);
    } catch (e) {
      if (!e.statusCode) {
        e.statusCode = controller.signal.aborted ? 504 : 502;
        if (controller.signal.aborted) e.message = "Downloading this PDF took too long. Try a smaller file or a direct PDF link.";
      }
      return res.status(errorStatus(e, 502)).json({ error: e.message || "Could not download this PDF." });
    } finally {
      clearTimeout(timer);
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("pdf") && !bytes.subarray(0, 5).toString().startsWith("%PDF-")) {
      return res.status(415).json({ error: "The URL did not return a PDF." });
    }

    const parsed = await pdfParse(bytes, {
      pagerender: async pageData => {
        const content = await pageData.getTextContent();
        return "\n[[SNIP_PAGE_" + (pageData.pageIndex + 1) + "]]\n" +
          content.items.map(item => item.str || "").join(" ").replace(/\s+/g, " ").trim() + "\n";
      }
    });
    const split = String(parsed.text || "").split(/\[\[SNIP_PAGE_(\d+)\]\]/g);
    const blocks = [];
    let index = 0;
    for (let i = 1; i < split.length; i += 2) {
      const page = Number(split[i]);
      for (const item of toBlocks(split[i + 1] || "", page)) {
        blocks.push({ id: `pdf-${page}-${index}`, index: index++, text: item.text, section: `PDF page ${page}`, page });
      }
    }
    if (!blocks.length) {
      return res.status(422).json({ error: "This PDF has no readable text. Scanned-PDF OCR is not supported yet." });
    }

    const terms = [...new Set((question.toLowerCase().match(/[a-z0-9]{3,}/g) || []))];
    const ranked = blocks.map((b, i) => {
      const lower = b.text.toLowerCase();
      const score = terms.reduce((n, term) => n + (lower.includes(term) ? 1 : 0), 0);
      return { b, i, score };
    }).sort((a, b) => b.score - a.score || a.i - b.i);
    const chosen = new Map();
    for (const item of ranked.slice(0, 50)) {
      for (const neighbor of [blocks[item.i - 1], item.b, blocks[item.i + 1]]) {
        if (neighbor) chosen.set(neighbor.id, neighbor);
      }
    }
    const protocol = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const host = req.headers.host;
    if (!host) return res.status(500).json({ error: "Server host unavailable." });
    const analysis = await fetch(`${protocol}://${host}/api/find`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, blocks: [...chosen.values()].slice(0, 70) })
    });
    const result = await analysis.json().catch(() => ({}));
    if (!analysis.ok) return res.status(502).json({ error: result.error || "Snip could not analyze this PDF." });
    const evidence = (Array.isArray(result.evidence) ? result.evidence : []).map(item => {
      const block = blocks.find(b => b.id === item.block_id ||
        (item.block_index != null && b.index === Number(item.block_index)));
      if (!block) return null;
      return { ...item, page: block.page, text: String(item.text || item.passage || "").trim() };
    }).filter(item => item?.text && Number.isInteger(item.page) && item.page >= 1);
    return res.status(200).json({ evidence: evidence.slice(0, 3), pageCount: Number(parsed.numpages || 0) });
  } catch (error) {
    console.error("Snip PDF search error:", error);
    return res.status(errorStatus(error)).json({ error: error?.message || "Could not search this PDF." });
  }
}

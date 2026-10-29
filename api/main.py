from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF

app = FastAPI(title="Snip Backend")

# Enable CORS so your Chrome extension can communicate with Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "service": "Snip Backend is running"}

@app.post("/api/pdf-find")
@app.post("/api/v1/extract-pdf")
async def extract_pdf_endpoint(request: Request):
    """
    Handles PDF search requests from the Snip Chrome extension.
    Accepts natural-language questions and text blocks, returning
    evidence formatted specifically for pdf.js highlighting.
    """
    try:
        body = await request.json()
        question = str(body.get("question", "")).strip()
        blocks = body.get("blocks", [])
        
        if not question:
            raise HTTPException(status_code=400, detail="Question is required.")

        question_lower = question.lower()
        search_terms = [term for term in question_lower.split() if len(term) > 2]

        formatted_evidence = []
        
        # Rank provided text blocks by relevance to the query
        for idx, block in enumerate(blocks):
            text = str(block.get("text", "")).strip()
            if not text:
                continue
                
            text_lower = text.lower()
            
            # Match score based on keyword overlap
            score = sum(1 for term in search_terms if term in text_lower)
            
            if score > 0 or not search_terms:
                formatted_evidence.append({
                    "score": score,
                    "block_id": block.get("id", f"block-{idx}"),
                    "block_index": block.get("index", idx + 1),
                    "text": text,
                    "passage": text,
                    "quote": text[:120],  # Short quote anchor for tight DOM/PDF highlighting
                    "page": int(block.get("page", 1)),
                    "section": block.get("section", f"PDF page {block.get('page', 1)}")
                })

        # Sort evidence candidates by highest relevance score
        formatted_evidence.sort(key=lambda x: x["score"], reverse=True)

        # Fallback to top blocks if no explicit keyword matches were found
        if not formatted_evidence and blocks:
            for idx, block in enumerate(blocks[:5]):
                text = str(block.get("text", "")).strip()
                if text:
                    formatted_evidence.append({
                        "score": 0,
                        "block_id": block.get("id", f"block-{idx}"),
                        "block_index": block.get("index", idx + 1),
                        "text": text,
                        "passage": text,
                        "quote": text[:120],
                        "page": int(block.get("page", 1)),
                        "section": block.get("section", f"PDF page {block.get('page', 1)}")
                    })

        # Return exact JSON payload expected by Snip's pdf.js
        return {
            "answer": f"Found {len(formatted_evidence)} matching passage(s).",
            "evidence": formatted_evidence[:3],
            "pageCount": len(blocks)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Request processing error: {str(e)}")
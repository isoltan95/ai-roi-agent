import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from dotenv import load_dotenv

load_dotenv()

from app.models import UseCaseInput, ROIResult
from app.roi_agent import evaluate_roi
from app.report_generator import generate_report
from app.npc_structure import NPC_SECTORS

app = FastAPI(title="NPC AI ROI Agent", version="1.0.0")

# CORS configuration: allow localhost for development and any https origin for deployed frontends
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Allow all HTTPS origins (suitable for deployed static sites)
# In production, consider restricting to specific domains
allow_all_https = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not allow_all_https else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/sectors")
def get_sectors():
    return NPC_SECTORS


@app.post("/api/evaluate", response_model=ROIResult)
async def evaluate(inp: UseCaseInput):
    try:
        result = await evaluate_roi(inp)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-report")
async def generate_report_endpoint(result: ROIResult):
    try:
        doc_bytes = generate_report(result)
        safe_title = "".join(c for c in result.use_case_input.title if c.isalnum() or c in " _-")[:50]
        filename = f"NPC_AI_ROI_{safe_title.replace(' ', '_')}.docx"
        return Response(
            content=doc_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

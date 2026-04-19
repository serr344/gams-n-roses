import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(tags=["venues"])
DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "venues.json"


@router.get("/venues")
def get_venues():
    with DATA_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)

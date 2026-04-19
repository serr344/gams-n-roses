from pydantic import BaseModel


class PlacedItem(BaseModel):
    item_id: str
    x: int
    y: int


class SimulationRequest(BaseModel):
    venue_id: str
    placed_items: list[PlacedItem]


class SimulationResponse(BaseModel):
    user_score: int
    optimal_score: int
    verdict: str

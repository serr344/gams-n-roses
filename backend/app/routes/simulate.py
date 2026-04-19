from fastapi import APIRouter

from app.schemas import SimulationRequest, SimulationResponse
from app.scoring import calculate_user_score

router = APIRouter(tags=["simulate"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate_layout(payload: SimulationRequest) -> SimulationResponse:
    user_score = calculate_user_score(len(payload.placed_items))
    return SimulationResponse(
        user_score=user_score,
        optimal_score=user_score + 8,
        verdict="Solid layout. You can still reduce spillover near sensitive buildings."
    )

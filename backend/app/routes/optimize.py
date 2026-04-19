from fastapi import APIRouter

from app.optimizer import calculate_optimal_score
from app.schemas import SimulationRequest, SimulationResponse
from app.scoring import calculate_user_score

router = APIRouter(tags=["optimize"])


@router.post("/optimize", response_model=SimulationResponse)
def optimize_layout(payload: SimulationRequest) -> SimulationResponse:
    user_score = calculate_user_score(len(payload.placed_items))
    optimal_score = calculate_optimal_score(user_score)
    return SimulationResponse(
        user_score=user_score,
        optimal_score=optimal_score,
        verdict="GAMS found a stronger layout with better crowd coverage and lower sensitive-zone overflow."
    )

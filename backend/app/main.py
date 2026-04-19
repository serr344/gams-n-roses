from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.venues import router as venues_router
from app.routes.simulate import router as simulate_router
from app.routes.optimize import router as optimize_router

app = FastAPI(title="Gams N' Roses API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(venues_router)
app.include_router(simulate_router)
app.include_router(optimize_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Gams N' Roses backend is running."}

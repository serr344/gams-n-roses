# Gams N' Roses

Web-based 2D hackathon game where players design a concert venue under budget and noise constraints, then compare their score against a GAMSPy-optimized solution.

## Structure
- `frontend/` React + TypeScript + Vite
- `backend/` FastAPI + GAMSPy-ready backend
- `shared/` game rules, scoring notes, pitch notes

## Quick Start
### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

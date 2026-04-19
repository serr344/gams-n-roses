import type { SimulationResult } from '../types/game';

const API_BASE = 'http://localhost:8000';

export async function simulateLayout(payload: unknown): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to simulate layout');
  }

  return response.json();
}

export async function optimizeLayout(payload: unknown): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to optimize layout');
  }

  return response.json();
}

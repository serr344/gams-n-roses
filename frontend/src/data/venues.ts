import type { Venue } from '../types/venue';

export const venues: Venue[] = [
  {
    id: 'downtown-plaza',
    name: 'Downtown Plaza',
    capacity: 1000,
    budget: 1200,
    difficulty: 'hard',
    nearbyRisks: ['Office', 'Mall', 'Dense Buildings']
  },
  {
    id: 'riverside-park',
    name: 'Riverside Park',
    capacity: 700,
    budget: 1000,
    difficulty: 'medium',
    nearbyRisks: ['Library', 'Residential']
  },
  {
    id: 'edge-district-lot',
    name: 'Edge District Lot',
    capacity: 500,
    budget: 900,
    difficulty: 'easy',
    nearbyRisks: ['Warehouse', 'Parking']
  }
];

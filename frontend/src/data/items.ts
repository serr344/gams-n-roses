import type { Item } from '../types/item';

export const items: Item[] = [
  {
    id: 'standard-speaker',
    name: 'Standard Speaker',
    category: 'speaker',
    cost: 220,
    description: 'Balanced sound system with reliable coverage for most concert areas.'
  },
  {
    id: 'directional-speaker',
    name: 'Directional Speaker',
    category: 'speaker',
    cost: 340,
    description: 'Sends powerful sound toward one chosen direction with less side noise.'
  },
  {
    id: 'basic-barrier',
    name: 'Basic Barrier',
    category: 'barrier',
    cost: 170,
    description: 'Standard sound wall that reduces noise behind it.'
  },
  {
    id: 'smart-amplifier',
    name: 'Smart Amplifier',
    category: 'support',
    cost: 290,
    description: 'Improves speaker efficiency while reducing wasted noise.'
  }
];

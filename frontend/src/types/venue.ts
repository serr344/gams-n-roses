export interface Venue {
  id: string;
  name: string;
  capacity: number;
  budget: number;
  difficulty: 'easy' | 'medium' | 'hard';
  nearbyRisks: string[];
}

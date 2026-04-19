export interface Item {
  id: string;
  name: string;
  category: 'speaker' | 'support' | 'barrier' | 'control';
  cost: number;
  description: string;
}

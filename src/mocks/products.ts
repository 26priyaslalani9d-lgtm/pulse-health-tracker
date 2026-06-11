/** Shop catalog stub (local mock data). */

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Bands' | 'Chargers' | 'Apparel' | 'Recovery';
  rating: number;
  tint: string;
  blurb: string;
}

export const PRODUCT_CATEGORIES = ['All', 'Bands', 'Chargers', 'Apparel', 'Recovery'] as const;

export const PRODUCTS: Product[] = [
  { id: 'band-sport', name: 'Sport Band', price: 24.99, category: 'Bands', rating: 4.6, tint: '#34D26A', blurb: 'Sweat-proof fluoroelastomer band with quick-release pins.' },
  { id: 'band-leather', name: 'Leather Loop', price: 49.0, category: 'Bands', rating: 4.4, tint: '#B8862C', blurb: 'Full-grain leather, magnetic clasp, ages beautifully.' },
  { id: 'band-steel', name: 'Steel Mesh', price: 59.0, category: 'Bands', rating: 4.7, tint: '#A1A1AA', blurb: 'Milanese-style mesh with infinite micro-adjustment.' },
  { id: 'charger-duo', name: 'Duo Charger', price: 39.0, category: 'Chargers', rating: 4.3, tint: '#5EA0EF', blurb: 'Charges phone and earbuds on one pad.' },
  { id: 'charger-travel', name: 'Travel Puck', price: 29.0, category: 'Chargers', rating: 4.5, tint: '#4DD0E1', blurb: 'Pocket charger with fold-flat plug and USB-C.' },
  { id: 'tee-run', name: 'Pulse Run Tee', price: 34.0, category: 'Apparel', rating: 4.8, tint: '#FF4D4D', blurb: 'Featherweight knit that wicks and never clings.' },
  { id: 'cap-trail', name: 'Trail Cap', price: 27.0, category: 'Apparel', rating: 4.2, tint: '#F5C518', blurb: 'Packable five-panel with reflective hits.' },
  { id: 'roller-deep', name: 'Deep Roller', price: 45.0, category: 'Recovery', rating: 4.6, tint: '#8B5CF6', blurb: 'High-density foam roller for post-run recovery.' },
  { id: 'massage-gun', name: 'Percussion Mini', price: 89.0, category: 'Recovery', rating: 4.7, tint: '#FF3B7A', blurb: 'Four heads, three speeds, whisper-quiet motor.' },
];

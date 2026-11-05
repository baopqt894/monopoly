/** Adopted P/H schedule in game units, mapped to cities in travel order.
 * Six purchase bundles were checked in gameplay; remaining rows follow the
 * inferred price bands. This is not a fully verified current Business Tour dump.
 * See docs/BUSINESS_TOUR_PRICING_RESEARCH.md for evidence and limitations.
 */
export const BOARD_32_PRICES = [
  { city: 'Granada', price: 60, houseCost: 50 },
  { city: 'Seville', price: 60, houseCost: 50 },
  { city: 'Madrid', price: 60, houseCost: 50 },
  { city: 'Hong Kong', price: 100, houseCost: 50 },
  { city: 'Beijing', price: 100, houseCost: 50 },
  { city: 'Shanghai', price: 120, houseCost: 50 },
  { city: 'Venice', price: 140, houseCost: 100 },
  { city: 'Milan', price: 140, houseCost: 100 },
  { city: 'Rome', price: 160, houseCost: 100 },
  { city: 'Hamburg', price: 180, houseCost: 100 },
  { city: 'Berlin', price: 200, houseCost: 100 },
  { city: 'London', price: 220, houseCost: 150 },
  { city: 'Sydney', price: 240, houseCost: 150 },
  { city: 'Chicago', price: 260, houseCost: 150 },
  { city: 'Las Vegas', price: 260, houseCost: 150 },
  { city: 'New York', price: 280, houseCost: 150 },
  { city: 'Lyon', price: 300, houseCost: 200 },
  { city: 'Paris', price: 320, houseCost: 200 },
  { city: 'Osaka', price: 350, houseCost: 200 },
  { city: 'Tokyo', price: 400, houseCost: 200 },
] as const;

/** Snapshot compatibility: pre-v2 rooms retain their original P/H schedule. */
export const LEGACY_32_PRICES = [
  60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 280, 300, 320, 350, 400,
] as const;

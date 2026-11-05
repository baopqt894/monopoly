/**
 * Approved Business Tour rent reference, in thousands (1 here = 1k there).
 * Source: https://imgur.com/FWvaZjA (player observations, May 2020).
 * Rows follow city travel order, independently of purchase prices/color groups.
 * Columns: base claim, one house, two houses, three houses, hotel.
 * The source rounds some amounts to whole thousands; these approved values are
 * intentional, not a formula inferred from construction costs.
 */
export const BOARD_32_RENT_REFERENCE = [
  { city: 'Granada', rents: [2, 25, 50, 75, 150] },
  { city: 'Seville', rents: [2, 28, 55, 83, 165] },
  { city: 'Madrid', rents: [4, 30, 60, 90, 180] },
  { city: 'Hong Kong', rents: [6, 33, 65, 98, 195] },
  { city: 'Beijing', rents: [6, 35, 75, 105, 210] },
  { city: 'Shanghai', rents: [8, 38, 75, 113, 225] },
  { city: 'Venice', rents: [10, 70, 140, 210, 385] },
  { city: 'Milan', rents: [10, 75, 150, 225, 413] },
  { city: 'Rome', rents: [12, 80, 160, 240, 440] },
  { city: 'Hamburg', rents: [14, 85, 170, 255, 468] },
  { city: 'Berlin', rents: [16, 90, 180, 270, 495] },
  { city: 'London', rents: [18, 113, 225, 338, 619] },
  { city: 'Sydney', rents: [20, 120, 240, 360, 660] },
  { city: 'Chicago', rents: [22, 128, 255, 383, 701] },
  { city: 'Las Vegas', rents: [22, 135, 270, 405, 743] },
  { city: 'New York', rents: [24, 143, 285, 428, 784] },
  { city: 'Lyon', rents: [26, 170, 340, 510, 935] },
  { city: 'Paris', rents: [28, 180, 360, 540, 990] },
  { city: 'Osaka', rents: [35, 190, 380, 570, 1045] },
  { city: 'Tokyo', rents: [50, 200, 400, 600, 1100] },
] as const;

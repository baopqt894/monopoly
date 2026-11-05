import type { CityEvent } from '@typhu/contracts';

export const CITY_EVENTS: readonly CityEvent[] = [
  { id: 'river-festival', name: 'Lễ hội ven sông', description: 'Các khu Bắc Bộ và Đất phương Nam tăng 25% tiền thuê.', groups: ['green', 'sky'], multiplier: 1.25 },
  { id: 'art-week', name: 'Tuần lễ nghệ thuật', description: 'Biển đảo và Miền Tây tăng 25% tiền thuê.', groups: ['pink', 'brown'], multiplier: 1.25 },
  { id: 'market-days', name: 'Ngày hội giao thương', description: 'Tây Nguyên và Duyên hải tăng 25% tiền thuê.', groups: ['orange', 'red'], multiplier: 1.25 },
  { id: 'new-semester', name: 'Mùa tựu trường', description: 'Miền Trung và Hai thành phố tăng 25% tiền thuê.', groups: ['yellow', 'blue'], multiplier: 1.25 },
  { id: 'quiet-season', name: 'Thành phố nghỉ ngơi', description: 'Mọi khu phố trở về mức tiền thuê thông thường.', groups: [], multiplier: 1 },
];

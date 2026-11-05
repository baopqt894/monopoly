export const VIETNAM_PAWNS = [
  {
    id: 'street-rider',
    name: 'Tổ lái phố',
    subtitle: 'Xe số độ · áo khoác · phóng lợn',
    color: '#db6448',
  },
  {
    id: 'creator',
    name: 'Nhà sáng tạo',
    subtitle: 'Điện thoại · đèn livestream · outfit phố',
    color: '#ac80be',
  },
  {
    id: 'gymmer',
    name: 'Anh gymer',
    subtitle: 'Tank đen · đùi khủng · selfie phòng gym',
    color: '#a87b5c',
  },
  {
    id: 'wibu',
    name: 'Anh wibu',
    subtitle: 'Kính tròn · manga · balô anime',
    color: '#708ca9',
  },
  {
    id: 'pickleball',
    name: 'Nàng pickleball',
    subtitle: 'Váy xếp ly · vợt mint · bóng vàng',
    color: '#b596c8',
  },
  {
    id: 'xe-om',
    name: 'Anh Grab',
    subtitle: 'Áo xanh · mũ Grab · thùng giao hàng',
    color: '#249e54',
  },
  {
    id: 'star-vendor',
    name: 'Chú bé tliet',
    subtitle: 'Áo khoác đỏ · xe lăn · 6 đèn ông sao',
    color: '#c95043',
  },
  {
    id: 'ao-dai',
    name: 'Nàng thơ áo dài',
    subtitle: 'Áo dài ngọc · bó sen · nón lá',
    color: '#5b9f89',
  },
] as const;

export type VietnamPawnKind =
  (typeof VIETNAM_PAWNS)[number]['id'] | 'cyclo' | 'buffalo-boy' | 'vendor';
export function isVietnamPawn(kind: string): kind is VietnamPawnKind {
  return (
    VIETNAM_PAWNS.some((pawn) => pawn.id === kind) ||
    ['cyclo', 'buffalo-boy', 'vendor'].includes(kind)
  );
}

import { mapTilesFor } from './board32-layout';
import type { DeckKind, GameCard } from '@typhu/contracts';

export const CHANCE_CARDS: readonly GameCard[] = [
  { id: 'chance-01', title: 'Khởi đầu mới', description: 'Tiến đến ô Xuất phát. Nhận tiền theo cài đặt phòng.', effect: { type: 'move', destination: 0 } },
  { id: 'chance-02', title: 'Thành phố chờ bạn', description: 'Tiến đến TP. Hồ Chí Minh. Nhận lương nếu đi qua Xuất phát.', effect: { type: 'move', destination: 39 } },
  { id: 'chance-03', title: 'Hẹn tại trung tâm', description: 'Tiến đến Đồng Khởi. Nhận lương nếu đi qua Xuất phát.', effect: { type: 'move', destination: 24 } },
  { id: 'chance-04', title: 'Một tối nghệ thuật', description: 'Tiến đến Tràng Tiền. Nhận lương nếu đi qua Xuất phát.', effect: { type: 'move', destination: 11 } },
  { id: 'chance-05', title: 'Chuyến tàu bất ngờ', description: 'Tiến đến ga gần nhất. Nếu ga có chủ, trả gấp đôi tiền thuê.', effect: { type: 'nearest', kind: 'railroad' } },
  { id: 'chance-06', title: 'Đến quảng trường Lễ hội', description: 'Di chuyển đến ô Lễ hội để chọn nơi tổ chức lễ hội. Nhận tiền nếu đi qua Xuất phát.', effect: { type: 'move-special', destination: 'festival-corner' } },
  { id: 'chance-07', title: 'Chuyến bay sắp tới', description: 'Di chuyển đến Sân bay, nhận vé bay cho lượt chính kế tiếp. Nhận tiền nếu đi qua Xuất phát.', effect: { type: 'move-special', destination: 'airport' } },
  { id: 'chance-08', title: 'Cổ tức đầu tư', description: 'Ngân hàng trả cho bạn ₫50 tiền cổ tức.', effect: { type: 'money', amount: 50 } },
  { id: 'chance-09', title: 'Thẻ thoát đảo', description: 'Giữ thẻ này để rời Đảo hoang miễn phí trong một lượt sau.', effect: { type: 'jail-free' } },
  { id: 'chance-10', title: 'Lùi lại một chút', description: 'Lùi 3 ô và thực hiện hành động tại ô đến.', effect: { type: 'back', steps: 3 } },
  { id: 'chance-11', title: 'Lạc ra đảo', description: 'Đi thẳng ra Đảo hoang. Không nhận lương Xuất phát.', effect: { type: 'jail' } },
  { id: 'chance-12', title: 'Bảo trì công trình', description: 'Trả ₫25 cho mỗi nhà và ₫100 cho mỗi khách sạn bạn sở hữu.', effect: { type: 'repairs', house: 25, hotel: 100 } },
  { id: 'chance-13', title: 'Phí giao thông', description: 'Thanh toán ₫15 cho ngân hàng.', effect: { type: 'money', amount: -15 } },
  { id: 'chance-14', title: 'Về ga đầu tiên', description: 'Tiến đến Ga Hà Nội. Nhận lương nếu đi qua Xuất phát.', effect: { type: 'move', destination: 5 } },
  { id: 'chance-15', title: 'Chủ trì hội đồng', description: 'Trả ₫50 cho mỗi người chơi còn lại.', effect: { type: 'each', amount: -50 } },
  { id: 'chance-16', title: 'Khoản đầu tư đáo hạn', description: 'Nhận ₫150 từ ngân hàng.', effect: { type: 'money', amount: 150 } },
];

export const CHEST_CARDS: readonly GameCard[] = [
  { id: 'chest-01', title: 'Một vòng khởi sắc', description: 'Tiến đến ô Xuất phát. Nhận tiền theo cài đặt phòng.', effect: { type: 'move', destination: 0 } },
  { id: 'chest-02', title: 'Ngân hàng hoàn tiền', description: 'Một giao dịch được điều chỉnh. Nhận ₫200.', effect: { type: 'money', amount: 200 } },
  { id: 'chest-03', title: 'Khám sức khỏe', description: 'Thanh toán viện phí ₫50.', effect: { type: 'money', amount: -50 } },
  { id: 'chest-04', title: 'Phiên chợ cuối tuần', description: 'Bán đồ cũ và nhận ₫50.', effect: { type: 'money', amount: 50 } },
  { id: 'chest-05', title: 'Thẻ thoát đảo', description: 'Giữ thẻ này để rời Đảo hoang miễn phí trong một lượt sau.', effect: { type: 'jail-free' } },
  { id: 'chest-06', title: 'Quà từ khu phố', description: 'Nhận ₫50 từ quỹ khu phố.', effect: { type: 'money', amount: 50 } },
  { id: 'chest-07', title: 'Quỹ tiết kiệm', description: 'Khoản tiết kiệm đáo hạn. Nhận ₫100.', effect: { type: 'money', amount: 100 } },
  { id: 'chest-08', title: 'Hoàn thuế', description: 'Nhận ₫20 từ ngân hàng.', effect: { type: 'money', amount: 20 } },
  { id: 'chest-09', title: 'Sinh nhật vui vẻ', description: 'Mỗi người chơi còn lại tặng bạn ₫10.', effect: { type: 'each', amount: 10 } },
  { id: 'chest-10', title: 'Bảo hiểm chi trả', description: 'Nhận khoản bảo hiểm ₫100.', effect: { type: 'money', amount: 100 } },
  { id: 'chest-11', title: 'Chăm sóc gia đình', description: 'Thanh toán chi phí y tế ₫100.', effect: { type: 'money', amount: -100 } },
  { id: 'chest-12', title: 'Học phí', description: 'Thanh toán học phí ₫50.', effect: { type: 'money', amount: -50 } },
  { id: 'chest-13', title: 'Tư vấn thành công', description: 'Nhận thù lao ₫25.', effect: { type: 'money', amount: 25 } },
  { id: 'chest-14', title: 'Sửa sang khu phố', description: 'Trả ₫40 cho mỗi nhà và ₫115 cho mỗi khách sạn bạn sở hữu.', effect: { type: 'repairs', house: 40, hotel: 115 } },
  { id: 'chest-15', title: 'Khu vườn đẹp nhất', description: 'Đạt giải khu vườn đẹp. Nhận ₫10.', effect: { type: 'money', amount: 10 } },
  { id: 'chest-16', title: 'Món quà bất ngờ', description: 'Nhận khoản thừa kế ₫100.', effect: { type: 'money', amount: 100 } },
];

export const DECKS: Record<DeckKind, readonly GameCard[]> = { chance: CHANCE_CARDS, chest: CHEST_CARDS };
/** Added only to new landing-rule games; old saved decks and their IDs stay unchanged. */
export const PROPERTY_EVENT_CARDS: readonly GameCard[] = [
  { id: 'chance-17', title: 'Động đất', description: 'Chọn thành phố của đối thủ có nhà cấp 1–4. Phá hủy toàn bộ nhà và mất quyền sở hữu ô đất. Không hoàn tiền.', effect: { type: 'property-event', event: 'earthquake' } },
  { id: 'chance-18', title: 'Hỏa hoạn', description: 'Chọn thành phố của đối thủ có nhà cấp 1–4 và hạ một cấp. Không áp dụng với công trình đặc trưng.', effect: { type: 'property-event', event: 'fire' } },
  { id: 'chance-19', title: 'Buộc bán nhà', description: 'Buộc đối thủ bán một thành phố chưa có công trình đặc trưng về ngân hàng. Hoàn đúng giá đất cộng giá trị xây dựng hiện có.', effect: { type: 'property-event', event: 'forced-sale' } },
  { id: 'chance-20', title: 'Cúp điện', description: 'Chọn thành phố của đối thủ để ngừng thu lợi nhuận đến khi chủ đất qua Xuất phát thêm 3 lần. Áp dụng được với công trình đặc trưng.', effect: { type: 'property-event', event: 'power-outage' } },
];
export const TRAVEL_GIFT_CARDS: readonly GameCard[] = [
  { id: 'chance-21', title: 'Hẹn ở Lễ hội', description: 'Di chuyển đến thành phố đang tổ chức Lễ hội. Nhận tiền nếu đi qua Xuất phát.', effect: { type: 'move-special', destination: 'festival-city' } },
  { id: 'chance-22', title: 'Đến cơ quan thuế', description: 'Di chuyển đến ô Thuế và đóng thuế theo luật hiện tại. Nhận tiền nếu đi qua Xuất phát.', effect: { type: 'move-special', destination: 'tax' } },
  { id: 'chance-23', title: 'Quà tặng bất động sản', description: 'Chọn một ô đất của mình và một người chơi khác để tặng nguyên ô cùng công trình hiện có, không nhận tiền.', effect: { type: 'gift-property' } },
];
export function getCard(deck: DeckKind, id: string, boardId?: 'vietnam-32', boardLayout?: 'districts-v1'): GameCard {
  const card = DECKS[deck].find((entry) => entry.id === id) ?? (deck === 'chance' ? [...PROPERTY_EVENT_CARDS, ...TRAVEL_GIFT_CARDS].find((entry) => entry.id === id) : undefined);
  if (!card) throw new Error(`Unknown card: ${id}`);
  if (boardId === 'vietnam-32' && (card.effect.type === 'jail' || card.effect.type === 'jail-free')) return { ...card, description: card.description.replaceAll('Đảo hoang', 'Côn Đảo') };
  if (boardId === 'vietnam-32' && deck === 'chance') {
    const destinations: Record<string, { destination: number; name: string }> = {
      'chance-02': { destination: 31, name: 'TP. Hồ Chí Minh' },
      'chance-03': { destination: 17, name: 'Đà Nẵng' },
      'chance-04': { destination: 15, name: 'Huế' },
      'chance-14': { destination: 4, name: 'Phú Quốc' },
    };
    const target = destinations[id];
    if (target) return { ...card, description: `Tiến đến ${target.name}. Nhận lương nếu đi qua Xuất phát.`, effect: { type: 'move', destination: mapTilesFor({boardLayout}).findIndex(tile => tile.name === target.name) } };
    if (card.effect.type === 'nearest') return { ...card, description: 'Tiến đến resort gần nhất. Nếu có chủ, trả gấp đôi tiền thuê.', effect: { type: 'nearest', kind: 'railroad' } };
  }
  return card;
}

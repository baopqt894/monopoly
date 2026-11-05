import type { GameState } from '@typhu/contracts';

export function rulesContent(game?: GameState) {
  const landing = game?.propertyRules === 'landing-v1';
  const resort = game?.boardId === 'vietnam-32' ? 'resort' : 'ga';
  return [
    {
      id: 'turn',
      title: 'Xúc xắc và lượt đi',
      paragraphs: [
        'Tung 2 xúc xắc, chờ hiện kết quả rồi quân cờ di chuyển. Lượt tiếp theo theo thứ tự danh sách người chơi, quay vòng theo chiều kim đồng hồ.',
        'Tung đôi được thêm lượt. Đôi lần thứ ba liên tiếp đưa thẳng ra Đảo hoang. Đi tiến qua hoặc đến Xuất phát nhận tiền theo cài đặt phòng và hoàn thành một vòng cá nhân.',
      ],
    },
    {
      id: 'build',
      title: 'Mua đất và nâng cấp',
      paragraphs: landing
        ? [
            game?.propertyPricing === 'level-one-included'
              ? 'Giá đất thành phố đã gồm nhà cấp 1. Có thể chọn mua kèm nhà đến cấp 3 trước khi hết vòng đầu, cấp 4 sau vòng đầu. Không giới hạn số ô đất được sở hữu.'
              : 'Mua thành phố kèm nhà tối thiểu cấp 1; chọn tối đa cấp 3 trước vòng đầu, cấp 4 sau vòng đầu. Không giới hạn số ô đất được sở hữu.',
            'Chỉ nâng cấp khi vừa đáp đúng đất của mình và đủ tiền. Đáp lại ô đã có nhà cấp 4 từ trước, sau vòng đầu, mới được xây công trình đặc trưng cấp 5. Resort/ga không xây nhà.',
          ]
        : [
            'Đáp đất chưa có chủ thì chọn mua hoặc bỏ qua. Bỏ qua không mất tiền và ô vẫn chưa có chủ.',
            game?.mode === 'city'
              ? 'Chế độ Thành phố cho xây đến cấp 2 khi chưa đủ nhóm; từ cấp 3 cần trọn nhóm màu. Xây đều và không xây trên đất thế chấp.'
              : 'Cần sở hữu đủ nhóm màu, không có ô thế chấp và xây đều trong nhóm. Nhà từ cấp 1–4, cấp 5 là công trình đặc trưng. Ngân hàng có 32 nhà và 12 công trình cấp 5.',
          ],
    },
    {
      id: 'rent',
      title: 'Tiền thuê và mua lại',
      paragraphs: landing
        ? [
            'Đáp đất đối thủ phải trả tiền thuê trước. Sở hữu trọn nhóm màu nhân đôi tiền thuê của các thành phố trong nhóm.',
            'Sau khi trả thuê, có thể mua lại thành phố vừa đáp với giá 1,5 lần giá trị đất và xây dựng hiện có; chủ cũ không được từ chối. Có thể nâng cấp ngay nếu đủ điều kiện. Không mua lại công trình cấp 5.',
          ]
        : [
            'Đáp tài sản đối thủ phải trả tiền thuê. Trọn nhóm màu nhân đôi tiền thuê đất chưa xây; ga tăng thuê theo số ga cùng chủ, tiện ích tính theo xúc xắc. Đất thế chấp không thu thuê.',
          ],
    },
    {
      id: 'cards',
      title: 'Thẻ cơ hội',
      paragraphs: [
        'Đáp ô thẻ để rút và xem nội dung. Thẻ cần chọn mục tiêu sẽ cho chọn trực tiếp trên bàn: ô hợp lệ sáng, ô còn lại tối. Mọi người đều thấy thẻ được rút.',
        ...(landing
          ? [
              'Động đất làm mất ô đất; hỏa hoạn giảm một cấp; buộc bán hoàn lại giá trị tài sản. Cúp điện ngừng thu thuê đến khi chủ đất qua Xuất phát 3 lần. Công trình cấp 5 chỉ chịu cúp điện trong các thẻ phá hoại này.',
            ]
          : [
              'Có hai bộ thẻ độc lập: Cơ hội và Quỹ Cộng đồng. Thẻ có thể đổi tiền, di chuyển hoặc cho quyền ra đảo; thẻ di chuyển chỉ xử lý ô đích.',
            ]),
      ],
    },
    ...(landing
      ? [
          {
            id: 'festival',
            title: 'Ô sự kiện và Lễ hội',
            paragraphs: [
              `Ô sự kiện được bốc ngẫu nhiên từ thành phố và ${resort} theo số lượng chủ phòng cài đặt, tăng tiền thuê ×1,25. Đây không phải giới hạn mua đất.`,
              `Đáp ô Lễ hội để chọn một thành phố của mình. Toàn bàn chỉ có một nơi tổ chức; chọn mới sẽ chuyển Lễ hội tới đó. Mỗi lần tổ chức cộng thêm ${(game?.festivalIncrement ?? 0.5) * 100}% tiền thuê, đếm chung toàn ván và cộng dồn với các hệ số khác.`,
            ],
          },
        ]
      : []),
    {
      id: 'flight',
      title: 'Sân bay',
      paragraphs: [
        'Đến Sân bay tự kết thúc lượt, kể cả tung đôi. Lượt chính kế tiếp đủ ₫50 thì chọn ô chưa có chủ hoặc đất của mình để bay; không được chọn ô rút thẻ, Thuế, Lễ hội, Đảo hoang hoặc đất của đối thủ.',
        'Thiếu phí hoặc hết giờ chưa chọn thì bỏ vé và tung xúc xắc, không thu phí bay. Bay qua Xuất phát vẫn nhận tiền và tính vòng. Xử lý ô bay đến xong vẫn được tung xúc xắc, trừ khi ô đến kết thúc lượt hoặc giữ bạn ở đảo.',
      ],
    },
    {
      id: 'island',
      title: 'Đảo hoang',
      paragraphs: [
        'Đáp ô Đảo hoang là bị giữ lại và hết lượt. Bị đưa thẳng ra đảo không nhận tiền Xuất phát và không tính hoàn thành vòng.',
        'Dùng thẻ hoặc trả ₫200 để ra rồi tung bình thường. Tung đôi để thoát thì đi theo tổng điểm và được tung thêm. Lần thử thứ ba được ra miễn phí, đi theo điểm đã tung.',
      ],
    },
    {
      id: 'money',
      title: 'Thuế và thanh toán nợ',
      paragraphs: [
        'Thuế là 10% tổng tiền mặt và giá trị đất, nhà, resort/ga đang sở hữu, làm tròn lên. Giá đất đã bao gồm nhà cấp 1 không bị tính trùng cấp này.',
        game?.liquidationRules === 'full-value-v1'
          ? 'Thiếu tiền: chọn bán nguyên ô đất theo toàn bộ giá trị hiện tại trong 30 giây. Hết giờ tự thanh lý đủ trả nợ, ưu tiên ô đã chọn. Bán hết vẫn thiếu thì phá sản. Không dùng thế chấp.'
          : 'Ván cũ cho bán cấp nhà hoặc thế chấp để trả nợ. Bán nhà nhận nửa chi phí xây; thế chấp nhận nửa giá đất. Giải chấp hoàn khoản vay cộng 10%. Không đủ trả nợ thì phá sản.',
      ],
    },
    {
      id: 'win',
      title: 'Điều kiện chiến thắng',
      paragraphs:
        game?.victoryRules === 'business-tour-v1'
          ? [
              `Thắng ngay khi sở hữu toàn bộ tài sản trên một cạnh, gồm thành phố và ${resort}; hoặc đủ 3 nhóm màu; hoặc đủ 4 ${resort}.`,
              'Bạn cũng thắng khi là người cuối cùng chưa phá sản, hoặc các đối thủ đều chủ động rời bàn. Mất kết nối tạm thời không tính là rời bàn.',
            ]
          : [
              'Người cuối cùng chưa phá sản thắng. Nếu kết thúc theo giới hạn vòng của ván cũ, so sánh tài sản ròng và tiền mặt để xác định người dẫn đầu.',
            ],
    },
  ];
}

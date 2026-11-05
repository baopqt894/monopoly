import type { RollFeedback } from './roll-feedback';
import './roll-result.css';

export function RollResult({ result, destinationName }: { result: RollFeedback; destinationName?: string }) {
  return (
    <div className="roll-feedback" role="status" aria-label={`Tổng xúc xắc ${result.total}${result.doubles ? ', đổ đôi' : ''}${destinationName ? `, ô đến ${destinationName}` : ''}`}>
      <div className="roll-total" aria-hidden="true">{result.total}</div>
      {result.doubles && <div className="roll-doubles" aria-hidden="true">Đổ đôi!</div>}
    </div>
  );
}

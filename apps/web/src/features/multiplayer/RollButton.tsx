import './roll-button.css';

export function RollDiceArtwork() {
  return (
    <svg
      viewBox="0 0 76 66"
      fill="none"
      stroke="#254f63"
      strokeWidth="2.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="39" cy="59" rx="30" ry="4" fill="#d2a84a" stroke="none" opacity=".3" />
      <g transform="rotate(12 49 28)">
        <path d="M34 10L53 5L69 17V40L50 47L34 34Z" fill="#f7f6dc" />
        <path d="M34 10L50 22L69 17M50 22V47" />
        <path d="M50 22L69 17V40L50 47Z" fill="#70b6c2" />
        <g fill="#254f63" stroke="none">
          <ellipse cx="52" cy="13" rx="2.8" ry="1.8" />
          <ellipse cx="42" cy="22" rx="2" ry="2.7" />
          <ellipse cx="42" cy="31" rx="2" ry="2.7" />
          <ellipse cx="57" cy="28" rx="2" ry="2.5" />
          <ellipse cx="63" cy="35" rx="2" ry="2.5" />
        </g>
      </g>
      <g transform="rotate(-12 27 41)">
        <path d="M7 27L27 19L46 30V52L26 61L7 49Z" fill="#fffdf0" />
        <path d="M7 27L26 39L46 30M26 39V61" />
        <path d="M26 39L46 30V52L26 61Z" fill="#ebd8a7" />
        <g fill="#254f63" stroke="none">
          <ellipse cx="27" cy="29" rx="3" ry="2" />
          <ellipse cx="15" cy="38" rx="2" ry="2.8" />
          <ellipse cx="19" cy="49" rx="2" ry="2.8" />
          <ellipse cx="33" cy="42" rx="2" ry="2.6" />
          <ellipse cx="39" cy="48" rx="2" ry="2.6" />
        </g>
      </g>
    </svg>
  );
}

export function RollButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button className="cartoon-roll-button" onClick={onClick} disabled={disabled}>
      <span className="roll-button-art">
        <RollDiceArtwork />
      </span>
      <span className="roll-button-label">{label}</span>
    </button>
  );
}

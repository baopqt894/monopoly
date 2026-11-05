/** Small filled illustrations with the same palette as the travel card artwork. */
export function AirportIcon({ kind }: { kind: 'plane' | 'destination' | 'dice' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="#254f63"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {kind === 'plane' ? (
        <>
          <path
            d="M8 27L18 25L29 9Q32 6 35 8L29 24L39 23L42 17L45 18L43 28Q42 31 37 32L26 33L19 41L14 40L18 32L9 33L4 28Z"
            fill="#fff9e9"
          />
          <path
            d="M29 24L35 8Q32 6 29 9L18 25M37 24L42 17L45 18L43 28M18 32L14 40L19 41L26 33"
            fill="#ed9475"
          />
          <path d="M25 28L29 27M33 27L35 27" stroke="#57adbd" />
        </>
      ) : kind === 'destination' ? (
        <>
          <path d="M4 20L16 16L30 21L43 16V39L30 44L16 39L4 43Z" fill="#a9d7c3" />
          <path d="M16 16L30 21V44L16 39Z" fill="#fff1c3" />
          <path d="M16 19V37M30 23V41" stroke="#7aab9b" strokeWidth="1.5" />
          <path
            d="M8 34Q15 26 21 33T37 34"
            stroke="#fff9e9"
            strokeWidth="3"
            strokeDasharray="3 4"
          />
          <path
            d="M35 28S23 16 23 11a12 12 0 0 1 24 0c0 5-12 17-12 17Z"
            transform="translate(-3 2) scale(.91)"
            fill="#ed9475"
          />
          <circle cx="29" cy="12" r="4" fill="#fff9e9" />
        </>
      ) : (
        <>
          <path d="M5 17L18 10L31 17V32L18 40L5 33Z" fill="#fff3ce" />
          <path d="M5 17L18 24L31 17M18 24V40" />
          <path d="M18 24L31 17V32L18 40Z" fill="#d6b97d" />
          <path d="M19 11L31 4L44 11V27L31 34L19 27Z" fill="#fffdf1" />
          <path d="M19 11L31 18L44 11M31 18V34" />
          <path d="M31 18L44 11V27L31 34Z" fill="#70b6c2" />
          <g fill="#254f63" stroke="none">
            <ellipse cx="31" cy="10" rx="2.3" ry="1.5" />
            <ellipse cx="25" cy="20" rx="1.8" ry="2.2" />
            <ellipse cx="37" cy="18" rx="1.6" ry="2.1" />
            <ellipse cx="38" cy="26" rx="1.6" ry="2.1" />
            <ellipse cx="11" cy="26" rx="1.8" ry="2.2" />
            <ellipse cx="12" cy="33" rx="1.8" ry="2.2" />
          </g>
        </>
      )}
    </svg>
  );
}

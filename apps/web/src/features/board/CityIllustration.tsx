function Building({
  x,
  y,
  width,
  height,
  color,
  roof = '#d3c5a7',
  windows = 3,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roof?: string;
  windows?: number;
}) {
  const depth = width * 0.48;
  return (
    <g>
      <path
        d={`M${x},${y} l${width},${width * 0.36} l${depth},-${depth * 0.65} l-${width},-${width * 0.36} Z`}
        fill={roof}
      />
      <path
        d={`M${x},${y} l${width},${width * 0.36} v${height} l-${width},-${width * 0.36} Z`}
        fill={color}
      />
      <path
        d={`M${x + width},${y + width * 0.36} l${depth},-${depth * 0.65} v${height} l-${depth},${depth * 0.65} Z`}
        fill={color}
        style={{ filter: 'brightness(.83)' }}
      />
      {Array.from({ length: windows }, (_, row) =>
        Array.from({ length: Math.max(2, Math.floor(width / 13)) }, (_, col) => (
          <path
            key={`${row}-${col}`}
            d={`M${x + 7 + col * 12},${y + 10 + row * 15 + (7 + col * 12) * 0.36} l5,1.8 v7 l-5,-1.8 Z`}
            fill="#456454"
            opacity=".45"
          />
        )),
      )}
    </g>
  );
}

export function CityIllustration() {
  return (
    <svg
      className="city-illustration"
      viewBox="0 0 540 300"
      aria-label="Minh họa một khu phố Việt Nam với cây xanh, nhà phố và tháp đồng hồ"
      role="img"
    >
      <defs>
        <pattern id="river-lines" width="35" height="15" patternUnits="userSpaceOnUse">
          <path d="M0 7h18" stroke="#97b8b0" strokeWidth="1.3" opacity=".5" />
        </pattern>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d6e0ce" />
          <stop offset="1" stopColor="#becfb9" />
        </linearGradient>
      </defs>
      <ellipse cx="274" cy="246" rx="215" ry="29" fill="#9eafa0" opacity=".1" />
      <path d="m34 177 251-112 229 97-246 117Z" fill="#b8cdc2" />
      <path d="m34 177 251-112 229 97-246 117Z" fill="url(#river-lines)" />
      <path d="m74 169 201-91 198 85-202 94Z" fill="url(#ground)" />
      <path d="m74 169 197 88v9L74 178Z" fill="#a6bda5" />
      <path d="m271 257 202-94v9L271 266Z" fill="#98b29e" />
      <path
        d="m119 148 195 86M199 111l194 85M110 194l201-94M194 231l200-94"
        stroke="#eeeade"
        strokeWidth="15"
      />
      <path
        d="m119 148 195 86M199 111l194 85M110 194l201-94M194 231l200-94"
        stroke="#c6cdbb"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <Building x={162} y={111} width={44} height={48} color="#e5d4aa" roof="#c8876d" windows={2} />
      <Building x={209} y={91} width={34} height={56} color="#d0d7c6" roof="#9baba0" windows={3} />
      <Building x={300} y={107} width={40} height={48} color="#e8d9ba" roof="#d49e7f" windows={2} />
      <Building x={348} y={125} width={31} height={37} color="#c5d2bc" roof="#8ea58a" windows={2} />
      <Building x={126} y={155} width={37} height={36} color="#dbc9a3" roof="#c7886a" windows={2} />
      <Building x={294} y={178} width={42} height={31} color="#e2cfaa" roof="#b58167" windows={1} />
      <Building x={348} y={169} width={31} height={33} color="#dce0ca" roof="#9fafa0" windows={1} />
      <Building x={215} y={178} width={40} height={39} color="#e8d9b9" roof="#c59d7f" windows={2} />
      <Building x={262} y={63} width={26} height={92} color="#d8caa5" roof="#b8b69a" windows={4} />
      <path d="m256 65 31 11 20-14-30-11Z" fill="#647f6a" />
      <path d="m262 58 17-30 20 32-12 9Z" fill="#7c947c" />
      <path d="m279 28 20 32-12 9Z" fill="#5e7c68" />
      <circle cx="276" cy="89" r="6.5" fill="#fbf3d8" />
      <path d="M276 85v4l3 2" fill="none" stroke="#6e7c62" strokeWidth="1.2" />
      {[
        [102, 165],
        [172, 186],
        [193, 147],
        [243, 110],
        [322, 116],
        [386, 152],
        [289, 225],
        [415, 169],
        [236, 230],
        [155, 210],
        [374, 203],
        [304, 94],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x + 3} cy={y + 14} rx="12" ry="5" fill="#809c7b" opacity=".2" />
          <path d={`M${x} ${y + 13}v-16`} stroke="#8d9471" strokeWidth="3" />
          <ellipse
            cx={x}
            cy={y - 6}
            rx={i % 2 ? 10 : 12}
            ry={i % 2 ? 17 : 12}
            fill={i % 3 ? '#91ac87' : '#698f73'}
          />
          <ellipse cx={x - 3} cy={y - 9} rx="6" ry="9" fill="#a7bf96" opacity=".7" />
        </g>
      ))}
      <path d="m250 190 21-10 22 10-21 10Z" fill="#95b6ad" stroke="#e4e3cc" strokeWidth="4" />
      <path d="M272 185v-14m-4 9 4-9 4 9" stroke="#e6e6d6" strokeWidth="2" fill="none" />
      <path d="m154 176 9 4 7-3-9-4Z" fill="#bf7c61" />
      <path d="m319 209 9 4 7-3-9-4Z" fill="#789ba0" />
    </svg>
  );
}

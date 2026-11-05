import React from 'react';
export function PropertyBuildingArt({ level, large = false }: { level: number; large?: boolean }) {
  const ink = '#234b60';
  const roofY = level === 2 ? 67 : 47;
  return (
    <svg
      className={large ? 'property-building large' : 'property-building'}
      viewBox="0 0 140 120"
      aria-hidden="true"
    >
      <g stroke={ink} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="71" cy="108" rx="53" ry="8" fill="#5ba5a9" stroke="none" opacity=".25" />
        <path d="M12 96 62 81 128 96 78 114Z" fill="#76d2a4" />
        <path d="m12 96 66 18v-6L12 90Z" fill="#54b994" />
        <path d="m78 108 50-18v6l-50 18Z" fill="#369f9e" />
        <path d="m12 90 50-15 66 15-50 18Z" fill="#a4e3ad" />
        {level === 1 ? (
          <>
            <ellipse cx="61" cy="94" rx="12" ry="4" fill="#559f83" stroke="none" />
            <path d="M61 30 101 41 61 55Z" fill="#f58e6f" />
            <path d="m66 35 24 7-24 8Z" fill="#ffbf7f" stroke="none" />
            <path d="M57 27 62 28V95L57 94Z" fill="#fff3bb" />
            <circle cx="59.5" cy="25" r="4" fill="#ffda76" />
          </>
        ) : level <= 3 ? (
          <>
            <path d={`M78 ${roofY + 12} 108 ${roofY - 3}V85L78 100Z`} fill="#f5c66d" />
            <path d={`M32 ${roofY} 55 ${roofY - 16} 78 ${roofY + 12}V100L32 88Z`} fill="#fff1ac" />
            {level === 3 && (
              <>
                <path d="m33 69 45 12 29-14" fill="none" stroke="#c39957" strokeWidth="2" />
                <path d="m41 58 13 3v11l-13-3Z" fill="#68cfde" />
                <path d="m62 64 10 3v11l-10-3Z" fill="#68cfde" />
                <path d="m87 67 12-6v8l-12 6Z" fill="#65c4d3" />
              </>
            )}
            <path d="m41 78 13 3v11l-13-3Z" fill="#64cbdc" />
            <path d="m62 83 10 3v12l-10-3Z" fill="#bf8259" />
            <path d="m87 85 12-6v8l-12 6Z" fill="#65c4d3" />
            <path
              d={`M55 ${roofY - 22} 85 ${roofY - 37} 116 ${roofY - 4} 82 ${roofY + 13}Z`}
              fill="#ffba75"
            />
            <path
              d={`M82 ${roofY + 13} 116 ${roofY - 4}V${roofY + 1}L82 ${roofY + 18}Z`}
              fill="#e5845d"
            />
            <path
              d={`M26 ${roofY + 1} 55 ${roofY - 22} 82 ${roofY + 13}`}
              fill="none"
              strokeWidth="4"
            />
            <path
              d={`m66 ${roofY - 16} 23 29m-13-34 22 29`}
              fill="none"
              stroke="#d98e5f"
              strokeWidth="2"
            />
            <path d="m44 82 7 2m40 2 5-3" fill="none" stroke="#d7f4e5" strokeWidth="1.8" />
          </>
        ) : (
          <>
            <path d="m33 30 45 11v60L33 90Z" fill="#fff3bb" />
            <path d="m78 41 28-12v60l-28 12Z" fill="#f1c36e" />
            <path d="m28 26 29-12 55 14-34 16Z" fill="#42c5c6" />
            <path d="m28 26 50 13 34-14v9L78 48 28 35Z" fill="#169aa9" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path d={`m42 ${43 + i * 15} 10 3v9l-10-3Z`} fill="#62cde4" />
                <path d={`m61 ${48 + i * 15} 9 3v9l-9-3Z`} fill="#62cde4" />
                <path d={`m86 ${45 + i * 15} 11-4v9l-11 4Z`} fill="#62cde4" />
              </g>
            ))}
            <path d="m37 84 36 9 10-7-36-9Z" fill="#ef886a" />
            <path d="m47 87 14 4v14l-14-4Z" fill="#bd805a" />
          </>
        )}
        <path d="m58 103 11 3 13-4" fill="none" stroke="#fff9d6" />
        {level > 1 && (
          <>
            <path d="M117 91V75" stroke="#926b48" />
            <path d="M106 73c-4-10 4-18 11-15 10-5 19 11 9 17-7 7-15 4-20-2Z" fill="#86cf73" />
            <path d="m111 65 6-2" stroke="#cceda3" />
          </>
        )}
      </g>
    </svg>
  );
}

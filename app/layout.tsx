import type { Metadata } from 'next';
import '../apps/web/src/styles/tokens.css';
import '../apps/web/src/styles/global.css';

export const metadata: Metadata = {
  title: 'Tỷ Phú — Thành Phố Sống',
  description: 'Cờ tỷ phú 40 ô với sự kiện, đấu giá và những khu phố do bạn xây dựng.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@fontsource-variable/dm-sans';
import './globals.css';
export const metadata: Metadata = {
  title: 'Ellie Navigator — Women’s health, closer to you.',
  description:
    'Find women’s healthcare in Broward and Miami-Dade. Explore official care sources and organize personal appointments with Ellie, an initiative of Flowers for Women.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

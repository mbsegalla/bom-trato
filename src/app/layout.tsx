import './globals.css';

import type { Metadata } from 'next';
import { Geist_Mono, Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Bom Trato',
    template: '%s | Bom Trato',
  },
  description: 'Gestão simples para quem presta serviços.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter, Handjet } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/query';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const handjet = Handjet({
  variable: '--font-handjet',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RachaConta — Divida contas e organize despesas com Pix',
  description:
    'Rache contas rapidamente com Pix Copia e Cola / QR Code ou gerencie despesas compartilhadas em grupos de amigos, república ou viagens.',
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icon.svg`,
    apple: `${basePath}/icon.svg`,
  },
  appleWebApp: { capable: true, title: 'RachaConta', statusBarStyle: 'black-translucent' },
};

// Aplica o tema antes da pintura (evita flash). Preferência: localStorage 'theme' = light | dark; ausente = sistema.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#0b0f14':'#f6f8fb');}catch(e){}})();`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0f14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${handjet.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-accent/20 selection:text-accent">
        <QueryProvider>
          <Suspense fallback={<div className="h-14 md:h-16 w-full border-b border-zinc-800" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

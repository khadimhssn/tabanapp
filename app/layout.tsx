import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taban — تابان | Read Any Book in 10 Minutes',
  description: 'AI-powered book summaries in Dari, Pashto, Urdu, Arabic, Hindi & English. Read any book in 10 minutes with 12 key takeaways.',
  keywords: ['book summaries', 'AI', 'Dari', 'Pashto', 'Urdu', 'Arabic', 'Hindi', 'Afghan literature'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0A1628" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}

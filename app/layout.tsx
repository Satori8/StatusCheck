import type { Metadata } from 'next';
import './globals.css';
import './dashboard/globals.css';

export const metadata: Metadata = {
  title: 'Status Check',
  description: 'Commitment & Deadline Tracking',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <main className="min-h-[100dvh] w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
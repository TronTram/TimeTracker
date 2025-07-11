import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/toast';
// import { ClerkProvider } from '@clerk/nextjs'; // Temporarily disabled for UI testing

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cursor Time Tracker',
  description: 'A focused time tracking application with Pomodoro technique support',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <div id="root" className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <ToastContainer position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}

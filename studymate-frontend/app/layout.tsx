import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyMate AI',
  description: 'Your personal AI study assistant',
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body>{children}</body>
      </html>
  );
}
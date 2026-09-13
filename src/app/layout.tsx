import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GatewayPulse | Payment Gateway SLA & Incident Registry',
  description:
    'Public accountability and incident resolution registry tracking payment gateway downtime, settlement delays, and response turnaround times for merchants.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50/50 text-neutral-900 selection:bg-neutral-200">
        {children}
      </body>
    </html>
  );
}

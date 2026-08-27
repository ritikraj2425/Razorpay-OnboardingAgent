import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelPay -- AI Merchant Verification",
  description: "Autonomous AI-powered merchant onboarding, KYC verification, and continuous risk monitoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

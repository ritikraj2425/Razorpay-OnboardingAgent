import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelPay",
  description: "Merchant onboarding and fraud monitoring risk orchestrator",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

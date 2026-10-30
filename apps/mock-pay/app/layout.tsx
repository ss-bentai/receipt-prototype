import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipt Prototype",
  description: "Mock payment terminal for the receipts prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,#e2e8f0_0%,transparent_60%)] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

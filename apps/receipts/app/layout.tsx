import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts",
  description: "Digital receipts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-navy bg-[radial-gradient(ellipse_at_top_left,var(--color-brand-sky)_0%,transparent_45%),linear-gradient(135deg,var(--color-brand-blue)_0%,var(--color-brand-navy)_70%)] bg-fixed text-white antialiased">
        {children}
      </body>
    </html>
  );
}

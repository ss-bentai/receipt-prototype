import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts",
  description: "Digital receipts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 bg-[radial-gradient(ellipse_at_top,#ffffff_0%,transparent_60%)] bg-fixed text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

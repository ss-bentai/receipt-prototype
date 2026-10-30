import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts",
  description: "Digital receipts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-800 bg-[radial-gradient(ellipse_at_top_left,#64748b_0%,transparent_45%),linear-gradient(135deg,#334155_0%,#0f172a_70%)] bg-fixed text-white antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TWOFER",
  description: "Parallel design debate — Claude + Codex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

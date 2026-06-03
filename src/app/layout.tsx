import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Visibility Scanner",
  description: "Generative search visibility intelligence scanner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

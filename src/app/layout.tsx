import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Snapbook — Fotoğraf Not Defteri",
  description: "Kişisel fotoğraf not defteriniz. Fotoğraflarınızı kategorize edin, notlar ekleyin, koleksiyonlar oluşturun.",
  manifest: "/snapbook/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snapbook",
  },
  icons: {
    icon: "/snapbook/icon-192.png",
    apple: "/snapbook/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased theme-light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/snapbook/icon-180.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

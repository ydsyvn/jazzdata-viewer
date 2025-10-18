import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jazzdata - Jazz Metadata Viewer",
  description:
    "Discover detailed credits for your favorite jazz tracks and albums",
  manifest: "/manifest.json",
  themeColor: "#121212",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jazzdata",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Suspense fallback={<div>Loading...</div>}>{children}</Suspense> */}
        {children}
      </body>
    </html>
  );
}

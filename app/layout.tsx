import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AnalyticsFooterNotice } from "@/components/analytics-footer-notice";
import { ClientAppBootstrap } from "@/components/client-app-bootstrap";
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
  title: "Life Tracker",
  description: "Daily direction tracker",
  manifest: "/manifest.json",
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientAppBootstrap />
        <div className="flex flex-1 flex-col">{children}</div>
        <AnalyticsFooterNotice />
      </body>
    </html>
  );
}

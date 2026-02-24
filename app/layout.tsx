import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { DemoButton } from "@/components/shared/DemoButton";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Federal Readiness Suite | Claude AI Deployment Assessment",
  description:
    "Evaluate how Claude can accelerate your agency's mission. Get a tailored architecture recommendation, live evaluation, compliance mapping, and implementation roadmap in minutes.",
  keywords: [
    "federal AI",
    "Claude",
    "Anthropic",
    "FedRAMP",
    "government AI deployment",
    "AI readiness assessment",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50 font-sans`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </div>
          <DemoButton />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

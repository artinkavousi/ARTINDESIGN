import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CanvasWrapper } from "@/components/CanvasWrapper";
import { UXAssistantChat } from "@/components/UXAssistantChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engine-First WebGPU Site",
  description: "A Three.js WebGPU/TSL-powered site with React Three Fiber",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CanvasWrapper />
        <div id="overlay" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
        <UXAssistantChat />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareCircle: verified funds for medical bills",
  description:
    "A hospital estimate becomes a verified fund. AI explains the bill, a reviewer approves it, relatives pay through PayPal, and money goes only to the hospital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} min-h-screen antialiased`}>
        <Header />
        {children}
        <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-muted">
          CareCircle is a hackathon demo on the PayPal sandbox. No real money moves, and every bill shown is synthetic.
          Holding money for others is regulated in real life; this is not a licensed service.
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareCircle: raise money for a hospital bill",
  description:
    "Families share one link. Relatives pay with PayPal from any country, and the money goes directly to the hospital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}>
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-xl">
              <span className="font-semibold text-foreground">This is a demo.</span> CareCircle runs on PayPal&apos;s
              test system, so no real money moves, and every bill on the site is made up. It is a hackathon project, not
              a licensed payment service.
            </p>
            <nav className="flex shrink-0 gap-4 whitespace-nowrap">
              <Link href="/#how-it-works" className="hover:text-foreground">
                How it works
              </Link>
              <Link href="/#questions" className="hover:text-foreground">
                Questions
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

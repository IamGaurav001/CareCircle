import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Used only for the italic accent words in the home page's headings.
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: "italic" });

export const metadata: Metadata = {
  title: "CareCircle: raise money for a hospital bill",
  description:
    "Families share one link. Relatives pay with PayPal from any country, and the money goes directly to the hospital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} flex min-h-screen flex-col antialiased`}>
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-sm flex-col gap-2">
              <span className="font-semibold">CareCircle</span>
              <p className="text-muted">
                Help with hospital bills, paid straight to the hospital. Made with care for families who are far from home.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-muted" aria-label="Footer">
              <Link href="/signup" className="hover:text-foreground">
                Start a fundraiser
              </Link>
              <Link href="/fundraisers" className="hover:text-foreground">
                Donate
              </Link>
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

import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The display face, used on headings, the wordmark and figures.
 *
 * It is already one of the five families a Brand Kit can pick, so the chrome
 * speaks the product's own typographic language. This copy comes from
 * next/font as a subset woff2 rather than the full TTF in public/fonts, which
 * exists for Satori and is an order of magnitude larger.
 */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Compose",
    template: "%s · Compose",
  },
  description:
    "Your personal AI content designer. Turn ideas, projects and lessons into on-brand Instagram posts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes the class on <html> before paint, which React sees as a mismatch.
    <html lang="en" suppressHydrationWarning>
      {/* Extensions add attributes to body before React hydrates. Applies to this
          element only, so real mismatches inside the app still surface. */}
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

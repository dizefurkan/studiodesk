import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { ConsentAnalytics } from "@/components/consent/ConsentAnalytics";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Display face for headings on the public site (landing, blog, legal)
const display = Geist({
  variable: "--font-display-face",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudioDesk - Dance Studio Management",
  applicationName: "StudioDesk",
  description: "All-in-one platform for managing dance studios",
  keywords: "dance studio, management, scheduling, students, instructors",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={await getLocale()} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} ${display.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <ConsentAnalytics />
      </body>
    </html>
  );
}

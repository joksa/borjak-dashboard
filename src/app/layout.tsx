import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Business Dashboard",
  description: "A modern business dashboard application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${dmSans.variable} font-sans antialiased h-full`}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="business-dashboard-theme"
        >
          <div className="h-full">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

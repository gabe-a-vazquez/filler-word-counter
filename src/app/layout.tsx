import { Inter } from "next/font/google";
import { cn } from "@filler-word-counter/lib/utils";
import { ThemeProvider } from "@filler-word-counter/components/ui/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Next.js",
  description: "Generated by Next.js",
};

import "./globals.css";
import Navbar from "@filler-word-counter/components/navigation/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

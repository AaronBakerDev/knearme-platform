import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppleSplashScreens } from "@/components/pwa/AppleSplashScreens";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

/**
 * Typography system - Clean, modern sans-serif.
 *
 * Geist: Primary font - geometric, readable, professional
 * Geist Mono: Code and technical text
 *
 * @see https://vercel.com/font
 */
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KnearMe | Masonry Portfolio Platform",
    template: "%s | KnearMe",
  },
  description: "Build a professional masonry portfolio in seconds. AI-powered case studies, SEO optimization, and lead generation for contractors.",
  metadataBase: new URL("https://knearme.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://knearme.com",
    title: "KnearMe | Masonry Portfolio Platform",
    description: "Build a professional masonry portfolio in seconds.",
    siteName: "KnearMe",
  },
  /**
   * Apple Touch Icons for iOS home screen.
   * 180x180 is the standard size for modern iOS devices (iPhone 6+ and iPad).
   * Older sizes (152x152, 167x167) are optional but recommended for iPad.
   * @see https://developer.apple.com/design/human-interface-guidelines/app-icons
   */
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [
      // 180x180: Modern iPhones (6+) and default size
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      // 167x167: iPad Pro
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      // 152x152: iPad (non-Pro)
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "KnearMe",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <AppleSplashScreens />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}

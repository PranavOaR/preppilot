import type { Metadata } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PrepPilot — Crack Your Campus Placements",
    template: "%s | PrepPilot",
  },
  description:
    "PrepPilot is India's premier technical interview prep platform. Master DSA, aptitude, mock tests, and AI-powered mock interviews tailored for TCS, Infosys, Wipro, Zoho, and more.",
  keywords: [
    "placement preparation",
    "DSA practice",
    "aptitude test",
    "TCS NQT",
    "Infosys InfyTQ",
    "campus placements India",
    "coding interview prep",
    "mock test",
    "competitive programming",
  ],
  authors: [{ name: "PrepPilot" }],
  creator: "PrepPilot",
  metadataBase: new URL("https://preppilot.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://preppilot.in",
    siteName: "PrepPilot",
    title: "PrepPilot — Crack Your Campus Placements",
    description:
      "Master DSA, aptitude, and company-specific mock tests for Indian campus placements.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrepPilot — Crack Your Campus Placements",
    description: "Master DSA, aptitude, and company-specific mock tests for Indian campus placements.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#7c6af7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PrepPilot" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

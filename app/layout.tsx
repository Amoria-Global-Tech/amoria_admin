"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { usePathname } from "next/navigation";
import Navbar from "./components/menu/navbar";

// Load Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth") || pathname.startsWith("/register");

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/user.svg" type="image/svg+xml" />

        {/* Viewport for responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Charset */}
        <meta charSet="UTF-8" />

        {/* SEO Meta */}
        <title>Amoria Global Tech - Blog Administartion</title>
        <meta
          name="description"
          content="Amoria Global Tech delivers cutting-edge software solutions, tailored systems, and innovative digital products for businesses of all sizes."
        />
        <meta
          name="keywords"
          content="Amoria Global Tech, software solutions, digital transformation, custom software, IT services, technology partner, innovation, systems development"
        />
        <meta name="author" content="Amoria Global Tech" />

        {/* Open Graph for Social Sharing */}
        <meta property="og:title" content="Amoria Global Tech - Software Solutions" />
        <meta
          property="og:description"
          content="Leading provider of custom software, digital systems, and technology innovation."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://www.amoriaglobal.com" />
        <meta property="og:type" content="website" />

        {/* Twitter Meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Amoria Global Tech - Software Solutions" />
        <meta
          name="twitter:description"
          content="Your trusted partner for cutting-edge software development and digital services."
        />
        <meta name="twitter:image" content="/og-image.png" />
      </head>

      <body className="antialiased bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
        {!isAuth && <Navbar />}

        <main className={`${!isAuth ? "md:ml-72 p-4 sm:p-6 md:p-10" : ""}`}>
          {children}
        </main>
      </body>
    </html>
  );
}

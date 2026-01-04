import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://xerekinha-frontend.onrender.com'),
  title: "Xerekinha - The Ultimate Drinking Card Game",
  description: "A multiplayer drinking card game for 2-10 players. Create rooms, answer questions, and have fun with friends!",
  keywords: ["card game", "drinking game", "multiplayer", "party game", "xerekinha"],
  authors: [{ name: "Xerekinha Team" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Xerekinha - The Ultimate Drinking Card Game",
    description: "A multiplayer drinking card game for 2-10 players. Create rooms, answer questions, and have fun with friends!",
    type: "website",
    siteName: "Xerekinha",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Xerekinha - The Ultimate Drinking Card Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xerekinha - The Ultimate Drinking Card Game",
    description: "A multiplayer drinking card game for 2-10 players",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script src="/cardmeister.min.js" strategy="beforeInteractive" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


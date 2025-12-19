import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xerekinha - The Ultimate Drinking Card Game",
  description: "A multiplayer drinking card game for 2-10 players. Create rooms, answer questions, and have fun with friends!",
  keywords: ["card game", "drinking game", "multiplayer", "party game", "xerekinha"],
  authors: [{ name: "Xerekinha Team" }],
  openGraph: {
    title: "Xerekinha - The Ultimate Drinking Card Game",
    description: "A multiplayer drinking card game for 2-10 players",
    type: "website",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

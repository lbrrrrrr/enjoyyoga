import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enjoy Yoga",
  description: "Discover your yoga practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

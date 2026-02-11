import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "enjoyyoga",
  description: "Discover your yoga practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

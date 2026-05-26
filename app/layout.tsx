import type { Metadata } from "next";
import { DM_Sans, Open_Sans, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

// Font stack del design system: Manrope primaria, DM Sans + Open Sans
// como fallbacks. Cada una con su CSS variable propia para que se pueda
// referenciar selectivamente desde globals.css y component styles.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promark®",
  description: "Inteligencia marcaria — plataforma multitenancy para gestión legal de marcas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${dmSans.variable} ${openSans.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

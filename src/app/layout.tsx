import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ashenpage",
  description: "La plataforma para escritores de horror y ciencia ficción",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
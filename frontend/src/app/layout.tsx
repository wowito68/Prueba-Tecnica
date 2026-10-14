import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entre páginas | Club de lectura",
  description: "Un espacio para reunir libros y compartir lecturas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

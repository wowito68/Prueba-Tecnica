import type { Metadata } from "next";
import { BookEditor } from "@/components/books/book-editor";

export const metadata: Metadata = { title: "Agregar libro | Entre páginas" };

export default function NewBookPage() {
  return <BookEditor />;
}

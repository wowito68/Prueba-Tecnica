import type { Metadata } from "next";
import { BookEditor } from "@/components/books/book-editor";

export const metadata: Metadata = { title: "Editar libro | Entre páginas" };

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookEditor key={id} id={id} />;
}

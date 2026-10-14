import type { Metadata } from "next";
import { BookDetail } from "@/components/books/book-detail";

export const metadata: Metadata = {
  title: "Detalle del libro | Entre páginas",
};

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { id } = await params;
  const { resultado } = await searchParams;
  return <BookDetail key={id} id={id} updated={resultado === "actualizado"} />;
}

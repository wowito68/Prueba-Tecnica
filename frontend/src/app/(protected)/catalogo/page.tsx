import type { Metadata } from "next";
import { Catalog } from "@/components/books/catalog";

export const metadata: Metadata = { title: "Catálogo | Entre páginas" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { resultado } = await searchParams;
  const message =
    resultado === "creado"
      ? "El libro se agregó correctamente al catálogo."
      : resultado === "eliminado"
        ? "El libro se eliminó del catálogo."
        : "";
  return <Catalog message={message} />;
}

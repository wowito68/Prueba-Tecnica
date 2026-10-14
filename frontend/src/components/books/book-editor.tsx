"use client";

import Link from "next/link";
import { useBook } from "@/hooks/use-book";
import { BookForm } from "./book-form";
import { BookError, BookLoading } from "./book-state";

export function BookEditor({ id }: { id?: string }) {
  const { book, loading, error, retry } = useBook(id);
  return (
    <>
      <Link href={id ? `/catalogo/${id}` : "/catalogo"} className="back-link">
        Volver {id ? "al detalle" : "al catálogo"}
      </Link>
      <div className="page-heading">
        <h1>{id ? "Editar libro" : "Agregar libro"}</h1>
        <p>
          {id
            ? "Actualiza los datos de esta lectura."
            : "Una nueva historia para nuestra biblioteca."}
        </p>
      </div>
      {loading ? (
        <BookLoading message="Cargando los datos del libro…" />
      ) : error ? (
        <BookError message={error} retry={retry} />
      ) : id && !book ? (
        <BookError message="Libro no encontrado" />
      ) : (
        <BookForm key={book?.id ?? "new"} book={book ?? undefined} />
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { booksApi, type Book } from "@/lib/books";
import { useRequestError } from "@/hooks/use-request-error";
import { Notice } from "../ui/notice";
import { BookCard } from "./book-card";
import { BookTable } from "./book-table";
import { BookEmpty, BookError, BookLoading } from "./book-state";
import { DeleteBookDialog } from "./delete-book-dialog";

export function Catalog({ message = "" }: { message?: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [selected, setSelected] = useState<Book | null>(null);
  const [success, setSuccess] = useState(message);
  const handleError = useRequestError();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    booksApi
      .list()
      .then(({ books }) => {
        if (active) setBooks(books);
      })
      .catch((error) => {
        if (active) setError(handleError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, handleError]);

  return (
    <>
      <div className="page-heading catalog-heading">
        <div>
          <h1>Catálogo</h1>
          <p>Las historias que nos reúnen, en un solo lugar.</p>
        </div>
        <Link href="/catalogo/nuevo" className="button button-primary">
          + Agregar libro
        </Link>
      </div>
      {success && <Notice variant="success">{success}</Notice>}
      <div className="catalog-toolbar">
        <p>
          {loading
            ? "Nuestra biblioteca"
            : `${books.length} ${books.length === 1 ? "libro en la biblioteca" : "libros en la biblioteca"}`}
        </p>
        <div
          className="view-switch"
          role="group"
          aria-label="Vista del catálogo"
        >
          <button
            type="button"
            aria-pressed={view === "cards"}
            onClick={() => setView("cards")}
          >
            Tarjetas
          </button>
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            Tabla
          </button>
        </div>
      </div>
      {loading ? (
        <BookLoading />
      ) : error ? (
        <BookError
          message={error}
          retry={() => setRevision((value) => value + 1)}
        />
      ) : books.length === 0 ? (
        <BookEmpty />
      ) : view === "cards" ? (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <BookTable books={books} onDelete={setSelected} />
      )}
      {selected && (
        <DeleteBookDialog
          book={selected}
          onClose={() => setSelected(null)}
          onDeleted={(book) => {
            setBooks((current) =>
              current.filter((item) => item.id !== book.id),
            );
            setSuccess(`Se eliminó «${book.titulo}» del catálogo`);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

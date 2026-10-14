"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBook } from "@/hooks/use-book";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";
import { BookCover } from "./book-cover";
import { BookError, BookLoading } from "./book-state";
import { DeleteBookDialog } from "./delete-book-dialog";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function BookDetail({ id, updated }: { id: string; updated: boolean }) {
  const { book, loading, error, retry } = useBook(id);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <Link href="/catalogo" className="back-link">
        Volver al catálogo
      </Link>
      {loading ? (
        <BookLoading message="Abriendo esta lectura…" />
      ) : error ? (
        <BookError message={error} retry={retry} />
      ) : (
        book && (
          <>
            {updated && (
              <Notice variant="success">
                Los cambios del libro se guardaron correctamente.
              </Notice>
            )}
            <article className="book-detail">
              <div className="detail-cover">
                <BookCover book={book} />
              </div>
              <div className="detail-content">
                <span className="genre-tag">{book.genero}</span>
                <h1>{book.titulo}</h1>
                <p className="detail-author">{book.autor}</p>
                <div className="detail-actions">
                  <Link
                    href={`/catalogo/${book.id}/editar`}
                    className="button button-primary"
                  >
                    Editar libro
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Eliminar libro
                  </Button>
                </div>
                <dl className="book-metadata">
                  <div>
                    <dt>ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </div>
                  <div>
                    <dt>Género</dt>
                    <dd>{book.genero}</dd>
                  </div>
                  <div>
                    <dt>Año de publicación</dt>
                    <dd>{book.anio_publicacion}</dd>
                  </div>
                  <div>
                    <dt>Páginas</dt>
                    <dd>{book.paginas}</dd>
                  </div>
                </dl>
                <section className="book-synopsis">
                  <h2>Sinopsis</h2>
                  <p>
                    {book.sinopsis ||
                      "Este libro todavía no tiene una sinopsis."}
                  </p>
                </section>
                <dl className="record-metadata">
                  <div>
                    <dt>ID del libro</dt>
                    <dd>{book.id}</dd>
                  </div>
                  <div>
                    <dt>Fecha de creación</dt>
                    <dd>
                      <time dateTime={book.created_at}>
                        {formatDate(book.created_at)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>Última actualización</dt>
                    <dd>
                      <time dateTime={book.updated_at}>
                        {formatDate(book.updated_at)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
            {confirmDelete && (
              <DeleteBookDialog
                book={book}
                onClose={() => setConfirmDelete(false)}
                onDeleted={() => {
                  router.replace("/catalogo?resultado=eliminado");
                  router.refresh();
                }}
              />
            )}
          </>
        )
      )}
    </>
  );
}

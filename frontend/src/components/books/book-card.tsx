import Link from "next/link";
import type { Book } from "@/lib/books";
import { BookCover } from "./book-cover";

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="book-card">
      <Link href={`/catalogo/${book.id}`} className="book-card-link">
        <div className="book-card-art">
          <BookCover book={book} />
        </div>
        <div className="book-card-info">
          <span className="genre-tag">{book.genero}</span>
          <h2>{book.titulo}</h2>
          <p>{book.autor}</p>
          <span className="book-card-detail">Ver detalle</span>
        </div>
      </Link>
    </article>
  );
}

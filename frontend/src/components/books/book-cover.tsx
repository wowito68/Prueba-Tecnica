import type { Book } from "@/lib/books";

export function BookCover({
  book,
}: {
  book: Pick<Book, "titulo" | "autor" | "genero" | "isbn">;
}) {
  const tone =
    Array.from(book.isbn).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    4;
  return (
    <div className={`book-cover tone-${tone}`} aria-hidden="true">
      <span className="cover-genre">{book.genero}</span>
      <span className="cover-title">{book.titulo}</span>
      <span className="cover-author">{book.autor}</span>
    </div>
  );
}

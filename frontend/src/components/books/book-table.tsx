import Link from "next/link";
import type { Book } from "@/lib/books";

export function BookTable({
  books,
  onDelete,
}: {
  books: Book[];
  onDelete: (book: Book) => void;
}) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Administración de libros"
      tabIndex={0}
    >
      <table className="book-table">
        <caption className="sr-only">Libros del club de lectura</caption>
        <thead>
          <tr>
            <th scope="col">Título</th>
            <th scope="col">Autor</th>
            <th scope="col">ISBN</th>
            <th scope="col">Género</th>
            <th scope="col">Año de publicación</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <th scope="row">
                <Link href={`/catalogo/${book.id}`}>{book.titulo}</Link>
              </th>
              <td>{book.autor}</td>
              <td>{book.isbn}</td>
              <td>
                <span className="genre-tag">{book.genero}</span>
              </td>
              <td>{book.anio_publicacion}</td>
              <td>
                <div className="table-actions">
                  <Link
                    href={`/catalogo/${book.id}`}
                    aria-label={`Ver ${book.titulo}`}
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/catalogo/${book.id}/editar`}
                    aria-label={`Editar ${book.titulo}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(book)}
                    aria-label={`Eliminar ${book.titulo}`}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

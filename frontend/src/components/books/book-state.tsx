import Link from "next/link";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";

export function BookLoading({
  message = "Cargando libros…",
}: {
  message?: string;
}) {
  return (
    <div className="book-loading" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      {message}
    </div>
  );
}

export function BookError({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="book-empty">
      <h2>No pudimos cargar esta lectura.</h2>
      <p role="alert">{message}</p>
      <div className="dialog-actions">
        {retry && <Button onClick={retry}>Volver a intentar</Button>}
        <Link href="/catalogo" className="text-link">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

export function BookEmpty() {
  return (
    <div className="book-empty">
      <Icon name="book" width="52" height="52" />
      <h2>La primera historia está por llegar.</h2>
      <p>Añade el primer libro para empezar el catálogo del club.</p>
      <Link href="/catalogo/nuevo" className="button button-primary">
        + Agregar libro
      </Link>
    </div>
  );
}

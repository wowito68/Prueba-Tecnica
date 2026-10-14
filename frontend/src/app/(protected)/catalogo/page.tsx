import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Catálogo | Entre páginas" };
export default function CatalogPage() {
  return (
    <>
      <div className="page-heading">
        <h1>Catálogo</h1>
        <p>Las historias que nos reúnen, en un solo lugar.</p>
      </div>
      <section
        className="catalog-placeholder"
        aria-labelledby="catalog-welcome"
      >
        <div className="catalog-illustration" aria-hidden="true">
          <Icon name="book" width="56" height="56" />
          <span className="catalog-dot" />
        </div>
        <h2 id="catalog-welcome">Un espacio para nuevas lecturas.</h2>
        <p>
          Estamos preparando el catálogo del club.
          <br />
          Pronto podrás descubrir y organizar los libros que compartimos.
        </p>
        <span className="status-label">Catálogo en preparación</span>
      </section>
      <div className="catalog-note">
        <span className="note-rule" />
        <p>Cada libro es el comienzo de una conversación.</p>
      </div>
    </>
  );
}

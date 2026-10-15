import type { BookList } from "@/lib/books";

export function CatalogPagination({
  pagination,
  onPage,
}: {
  pagination: BookList["pagination"];
  onPage: (page: number) => void;
}) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = pagination;
  if (totalPages <= 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  return (
    <nav className="catalog-pagination" aria-label="Paginación del catálogo">
      <p>
        Página {page} de {totalPages}
      </p>
      <div className="pagination-buttons">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={!hasPreviousPage}
          onClick={() => onPage(page - 1)}
        >
          ‹
        </button>
        {pages.map((value, index) => (
          <span key={value} className="pagination-item">
            {index > 0 && value - pages[index - 1] > 1 && (
              <span className="pagination-gap" aria-hidden="true">
                …
              </span>
            )}
            <button
              type="button"
              aria-label={`Página ${value}`}
              aria-current={value === page ? "page" : undefined}
              onClick={() => {
                if (value !== page) onPage(value);
              }}
            >
              {value}
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={!hasNextPage}
          onClick={() => onPage(page + 1)}
        >
          ›
        </button>
      </div>
    </nav>
  );
}

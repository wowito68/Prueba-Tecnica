"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { booksApi, type Book, type BookList } from "@/lib/books";
import { useRequestError } from "@/hooks/use-request-error";
import { Notice } from "../ui/notice";
import { Icon } from "../ui/icon";
import { BookCard } from "./book-card";
import { BookTable } from "./book-table";
import { BookEmpty, BookError, BookLoading } from "./book-state";
import { DeleteBookDialog } from "./delete-book-dialog";
import { CatalogPagination } from "./catalog-pagination";

export function Catalog({ message = "" }: { message?: string }) {
  const params = useSearchParams();
  const paramsString = params.toString();
  const search = params.get("search")?.trim() ?? "";
  const genero = params.get("genero")?.trim() ?? "";
  const rawPage = params.get("page") ?? "1";
  const page =
    /^[1-9]\d*$/.test(rawPage) &&
    Number.isSafeInteger(Number(rawPage)) &&
    (Number(rawPage) - 1) * 12 <= 2147483647
      ? Number(rawPage)
      : 1;
  const view = params.get("view") === "table" ? "table" : "cards";
  const queryKey = JSON.stringify([search, genero, page]);
  const [searchInput, setSearchInput] = useState(search);
  const [result, setResult] = useState<{ key: string; data: BookList } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Book | null>(null);
  const [success, setSuccess] = useState(message);
  const searchRef = useRef<HTMLInputElement>(null);
  const handleError = useRequestError();

  const navigate = useCallback(
    (changes: Record<string, string>, replace = false) => {
      const next = new URLSearchParams(paramsString);
      next.delete("resultado");
      for (const [key, value] of Object.entries(changes)) {
        if (
          !value ||
          (key === "page" && value === "1") ||
          (key === "view" && value === "cards")
        )
          next.delete(key);
        else next.set(key, value);
      }
      const href = `/catalogo${next.size ? `?${next}` : ""}`;
      if (replace) window.history.replaceState(null, "", href);
      else window.history.pushState(null, "", href);
    },
    [paramsString],
  );

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    setSearchInput(search);
  }, [search, genero, page]);
  useEffect(() => {
    setSuccess(message);
  }, [message]);
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timeout = setTimeout(() => {
      setSuccess("");
      navigate({ search: searchInput.trim(), page: "1" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, search, navigate]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    booksApi
      .list({ search, genero, page, limit: 12 }, controller.signal)
      .then((data) => {
        if (!active) return;
        const lastPage = Math.max(1, data.pagination.totalPages);
        if (page > lastPage) {
          navigateRef.current({ page: String(lastPage) }, true);
          return;
        }
        setResult({ key: queryKey, data });
        setLoading(false);
      })
      .catch((error) => {
        if (active) {
          setError(handleError(error));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, genero, page, queryKey, revision, handleError]);

  const pending =
    loading || result?.key !== queryKey || searchInput.trim() !== search;
  const data = result?.data;
  const books = data?.books ?? [];
  const pagination = data?.pagination;
  const genres = data?.genres ?? [];
  const clearFilters = () => {
    setSearchInput("");
    setSuccess("");
    navigate({ search: "", genero: "", page: "1" });
  };

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
      <div
        className="catalog-controls"
        role="search"
        aria-label="Buscar libros"
      >
        <div className="catalog-search">
          <Icon name="search" width="21" height="21" />
          <label className="sr-only" htmlFor="catalog-search">
            Buscar por título o autor
          </label>
          <input
            ref={searchRef}
            id="catalog-search"
            type="search"
            autoComplete="off"
            placeholder="Buscar por título o autor..."
            maxLength={200}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setSearchInput("");
                navigate({ search: "", page: "1" });
                searchRef.current?.focus();
              }}
            >
              <Icon name="close" width="18" height="18" />
            </button>
          )}
        </div>
        <div className="catalog-filter-row">
          <div className="catalog-genre">
            <Icon name="filter" width="19" height="19" />
            <label className="sr-only" htmlFor="catalog-genre">
              Filtrar por género
            </label>
            <select
              id="catalog-genre"
              value={genero}
              onChange={(event) => {
                setSuccess("");
                navigate({
                  genero: event.target.value,
                  search: searchInput.trim(),
                  page: "1",
                });
              }}
            >
              <option value="">Todos los géneros</option>
              {genero && !genres.includes(genero) && (
                <option value={genero}>{genero}</option>
              )}
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <div
            className="view-switch"
            role="group"
            aria-label="Vista del catálogo"
          >
            <button
              type="button"
              aria-pressed={view === "cards"}
              onClick={() => navigate({ view: "cards" })}
            >
              Tarjetas
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => navigate({ view: "table" })}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>
      <div
        className="catalog-toolbar"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>
          {error
            ? "Listado no disponible"
            : pending || !pagination
              ? "Consultando biblioteca…"
              : pagination.total === 0
                ? "0 libros encontrados"
                : `Mostrando ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} ${pagination.total === 1 ? "libro" : "libros"}`}
        </p>
        <p>Orden: recientes</p>
      </div>
      <div aria-busy={pending && !error}>
        {error ? (
          <BookError
            message={error}
            retry={() => setRevision((value) => value + 1)}
          />
        ) : pending ? (
          <BookLoading />
        ) : books.length === 0 ? (
          genres.length === 0 && !search && !genero ? (
            <BookEmpty />
          ) : (
            <div className="book-empty">
              <Icon name="search" width="42" height="42" />
              <h2>No encontramos libros que coincidan con tu búsqueda</h2>
              <p>Prueba con otro título, autor o género.</p>
              <button
                type="button"
                className="button button-primary"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          )
        ) : view === "cards" ? (
          <div className="book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <BookTable books={books} onDelete={setSelected} />
        )}
      </div>
      {!pending && !error && pagination && (
        <CatalogPagination
          pagination={pagination}
          onPage={(next) => navigate({ page: String(next) })}
        />
      )}
      {selected && (
        <DeleteBookDialog
          book={selected}
          onClose={() => setSelected(null)}
          onDeleted={(book) => {
            setLoading(true);
            setRevision((value) => value + 1);
            setSuccess(`Se eliminó «${book.titulo}» del catálogo`);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

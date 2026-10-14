"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { booksApi, type Book } from "@/lib/books";
import { ApiError } from "@/lib/api";
import { readBookForm } from "@/lib/book-form";
import { useRequestError } from "@/hooks/use-request-error";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Notice } from "../ui/notice";

export function BookForm({ book }: { book?: Book }) {
  const router = useRouter();
  const handleError = useRequestError();
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const cancelHref = book ? `/catalogo/${book.id}` : "/catalogo";

  useEffect(() => {
    if (pending) return;
    const field = [
      "titulo",
      "autor",
      "isbn",
      "genero",
      "anio_publicacion",
      "paginas",
      "sinopsis",
    ].find((field) => errors[field]);
    if (field)
      formRef.current
        ?.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >(`[name="${field}"]`)
        ?.focus();
  }, [errors, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const { input, errors } = readBookForm(new FormData(event.currentTarget));
    setErrors(errors);
    setError("");
    if (Object.keys(errors).length) return;
    submitting.current = true;
    setPending(true);
    try {
      if (book) {
        await booksApi.update(book.id, input);
        router.push(`/catalogo/${book.id}?resultado=actualizado`);
      } else {
        await booksApi.create(input);
        router.push("/catalogo?resultado=creado");
      }
      router.refresh();
    } catch (error) {
      setError(handleError(error));
      if (error instanceof ApiError)
        setErrors(
          error.status === 409 ? { isbn: error.message } : error.errors,
        );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="book-form"
      noValidate
      onSubmit={submit}
      aria-busy={pending}
    >
      {error && <Notice>{error}</Notice>}
      <p className="form-required-note">
        Todos los campos son obligatorios, excepto la sinopsis.
      </p>
      <fieldset disabled={pending} className="book-fields">
        <Field
          id="titulo"
          name="titulo"
          label="Título"
          required
          maxLength={200}
          defaultValue={book?.titulo}
          error={errors.titulo}
          placeholder="El título de esta historia"
        />
        <Field
          id="autor"
          name="autor"
          label="Autor"
          required
          maxLength={160}
          defaultValue={book?.autor}
          error={errors.autor}
          placeholder="Nombre del autor"
        />
        <Field
          id="isbn"
          name="isbn"
          label="ISBN"
          required
          maxLength={80}
          defaultValue={book?.isbn}
          error={errors.isbn}
          placeholder="Identificador único del libro"
        />
        <Field
          id="genero"
          name="genero"
          label="Género"
          required
          maxLength={80}
          defaultValue={book?.genero}
          error={errors.genero}
          placeholder="Por ejemplo, novela"
        />
        <Field
          id="anio_publicacion"
          name="anio_publicacion"
          label="Año de publicación"
          type="number"
          required
          step={1}
          min={-2147483648}
          max={new Date().getFullYear()}
          defaultValue={book?.anio_publicacion}
          error={errors.anio_publicacion}
          placeholder="1967"
        />
        <Field
          id="paginas"
          name="paginas"
          label="Páginas"
          type="number"
          required
          min={1}
          max={2147483647}
          step={1}
          defaultValue={book?.paginas}
          error={errors.paginas}
          placeholder="Número de páginas"
        />
        <div className="field form-wide">
          <label htmlFor="sinopsis">
            Sinopsis <span className="optional-label">(opcional)</span>
          </label>
          <textarea
            id="sinopsis"
            name="sinopsis"
            rows={6}
            maxLength={5000}
            defaultValue={book?.sinopsis ?? ""}
            aria-invalid={!!errors.sinopsis}
            aria-describedby={
              errors.sinopsis ? "sinopsis-error" : "sinopsis-hint"
            }
            placeholder="Cuéntanos de qué trata el libro"
          />
          {errors.sinopsis ? (
            <p id="sinopsis-error" className="field-error">
              {errors.sinopsis}
            </p>
          ) : (
            <p id="sinopsis-hint" className="field-hint">
              Máximo 5000 caracteres.
            </p>
          )}
        </div>
        <div className="form-actions form-wide">
          <Link
            href={cancelHref}
            className="button button-secondary"
            aria-disabled={pending}
            onClick={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando…"
              : book
                ? "Guardar cambios"
                : "Agregar libro"}
          </Button>
        </div>
      </fieldset>
      <span role="status" className="sr-only">
        {pending ? "Guardando libro" : ""}
      </span>
    </form>
  );
}

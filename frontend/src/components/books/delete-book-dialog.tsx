"use client";

import { useEffect, useRef, useState } from "react";
import { booksApi, type Book } from "@/lib/books";
import { useRequestError } from "@/hooks/use-request-error";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";

export function DeleteBookDialog({
  book,
  onClose,
  onDeleted,
}: {
  book: Book;
  onClose: () => void;
  onDeleted: (book: Book) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const handleError = useRequestError();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      previousFocus?.focus();
    };
  }, []);

  async function remove() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await booksApi.remove(book.id);
      onDeleted(book);
    } catch (error) {
      setError(handleError(error));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <h2 id="delete-title">¿Eliminar este libro?</h2>
      <p id="delete-description">
        Se eliminará <strong>«{book.titulo}»</strong>, de {book.autor}. Esta
        acción no se puede deshacer.
      </p>
      {error && <Notice>{error}</Notice>}
      <div className="dialog-actions">
        <button
          ref={cancelRef}
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={pending}
        >
          Cancelar
        </button>
        <Button
          type="button"
          className="button-danger"
          onClick={remove}
          disabled={pending}
        >
          {pending ? "Eliminando…" : "Eliminar libro"}
        </Button>
      </div>
      <span role="status" className="sr-only">
        {pending ? "Eliminando libro" : ""}
      </span>
    </dialog>
  );
}

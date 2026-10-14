"use client";

import { useEffect, useState } from "react";
import { booksApi, type Book } from "@/lib/books";
import { useRequestError } from "./use-request-error";

export function useBook(id?: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const handleError = useRequestError();
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError("");
    booksApi
      .get(id)
      .then(({ book }) => {
        if (active) setBook(book);
      })
      .catch((error) => {
        if (active) setError(handleError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, revision, handleError]);
  return {
    book,
    loading,
    error,
    retry: () => setRevision((value) => value + 1),
  };
}

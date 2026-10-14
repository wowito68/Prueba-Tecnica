import { request } from "./api";

export type Book = {
  id: string;
  isbn: string;
  titulo: string;
  autor: string;
  genero: string;
  anio_publicacion: number;
  paginas: number;
  sinopsis: string | null;
  created_at: string;
  updated_at: string;
};

export type BookInput = Omit<Book, "id" | "created_at" | "updated_at">;

export const booksApi = {
  list: () => request<{ books: Book[] }>("/books"),
  get: (id: string) =>
    request<{ book: Book }>(`/books/${encodeURIComponent(id)}`),
  create: (input: BookInput) =>
    request<{ book: Book }>("/books", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: BookInput) =>
    request<{ book: Book }>(`/books/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<void>(`/books/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

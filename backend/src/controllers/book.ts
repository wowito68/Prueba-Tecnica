import type { RequestHandler } from "express";
import { bookIdSchema, bookListSchema, bookSchema } from "../schemas/book";
import { bookService } from "../services/book";

export const listBooks: RequestHandler = async (request, response) => {
  response.json(await bookService.list(bookListSchema.parse(request.query)));
};

export const getBook: RequestHandler = async (request, response) => {
  response.json({
    book: await bookService.get(bookIdSchema.parse(request.params.id)),
  });
};

export const createBook: RequestHandler = async (request, response) => {
  const book = await bookService.create(bookSchema.parse(request.body));
  response.location(`/books/${book.id}`).status(201).json({ book });
};

export const updateBook: RequestHandler = async (request, response) => {
  const book = await bookService.update(
    bookIdSchema.parse(request.params.id),
    bookSchema.parse(request.body),
  );
  response.json({ book });
};

export const deleteBook: RequestHandler = async (request, response) => {
  await bookService.remove(bookIdSchema.parse(request.params.id));
  response.status(204).end();
};

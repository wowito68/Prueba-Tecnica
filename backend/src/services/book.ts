import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/http-error";
import { bookRepository } from "../repositories/book";
import type { BookInput } from "../schemas/book";

function translateWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      throw new HttpError(409, "Ya existe un libro con ese ISBN");
    if (error.code === "P2025") throw new HttpError(404, "Libro no encontrado");
  }
  throw error;
}

export const bookService = {
  list: () => bookRepository.list(),
  get: async (id: string) => {
    const book = await bookRepository.findById(id);
    if (!book) throw new HttpError(404, "Libro no encontrado");
    return book;
  },
  create: async (data: BookInput) => {
    try {
      return await bookRepository.create(data);
    } catch (error) {
      return translateWriteError(error);
    }
  },
  update: async (id: string, data: BookInput) => {
    try {
      return await bookRepository.update(id, data);
    } catch (error) {
      return translateWriteError(error);
    }
  },
  remove: async (id: string) => {
    try {
      await bookRepository.remove(id);
    } catch (error) {
      translateWriteError(error);
    }
  },
};

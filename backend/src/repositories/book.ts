import { prisma } from "../lib/prisma";
import type { BookInput } from "../schemas/book";

export const bookRepository = {
  list: () =>
    prisma.libro.findMany({ orderBy: [{ created_at: "desc" }, { id: "asc" }] }),
  findById: (id: string) => prisma.libro.findUnique({ where: { id } }),
  create: (data: BookInput) => prisma.libro.create({ data }),
  update: (id: string, data: BookInput) =>
    prisma.libro.update({ where: { id }, data }),
  remove: (id: string) => prisma.libro.delete({ where: { id } }),
};

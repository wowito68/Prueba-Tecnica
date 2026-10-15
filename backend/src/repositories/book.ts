import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { BookInput, BookListQuery } from "../schemas/book";

const literalPattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export const bookRepository = {
  list: ({ search, genero, page, limit }: BookListQuery) => {
    const where: Prisma.LibroWhereInput = {
      ...(search
        ? {
            OR: [
              {
                titulo: {
                  contains: literalPattern(search),
                  mode: "insensitive",
                },
              },
              {
                autor: {
                  contains: literalPattern(search),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(genero
        ? { genero: { equals: literalPattern(genero), mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction(
      [
        prisma.libro.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ created_at: "desc" }, { id: "asc" }],
        }),
        prisma.libro.count({ where }),
        prisma.libro.groupBy({ by: ["genero"], orderBy: { genero: "asc" } }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  },
  findById: (id: string) => prisma.libro.findUnique({ where: { id } }),
  create: (data: BookInput) => prisma.libro.create({ data }),
  update: (id: string, data: BookInput) =>
    prisma.libro.update({ where: { id }, data }),
  remove: (id: string) => prisma.libro.delete({ where: { id } }),
};

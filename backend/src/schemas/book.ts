import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `Máximo ${max} caracteres`);

export const bookIdSchema = z.uuid("El ID del libro no es válido");

export const bookSchema = z
  .object({
    isbn: requiredText("El ISBN", 80),
    titulo: requiredText("El título", 200),
    autor: requiredText("El autor", 160),
    genero: requiredText("El género", 80),
    anio_publicacion: z
      .number("Introduce un año válido")
      .int("El año debe ser entero")
      .min(-2147483648)
      .refine(
        (value) => value <= new Date().getFullYear(),
        "El año no puede ser mayor al actual",
      ),
    paginas: z
      .number("Introduce un número de páginas válido")
      .int("Las páginas deben ser un número entero")
      .positive("Las páginas deben ser mayores a cero")
      .max(2147483647),
    sinopsis: z
      .string()
      .trim()
      .max(5000, "Máximo 5000 caracteres")
      .nullish()
      .transform((value) => value || null),
  })
  .strict();

export type BookInput = z.infer<typeof bookSchema>;

const positiveQueryInteger = (fallback: string, max: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Introduce un entero positivo")
    .default(fallback)
    .transform(Number)
    .pipe(z.number().int().max(max));

export const bookListSchema = z
  .object({
    search: z.string().trim().max(200).default(""),
    genero: z.string().trim().max(80).default(""),
    page: positiveQueryInteger("1", 2147483647),
    limit: positiveQueryInteger("12", 50),
  })
  .refine((value) => (value.page - 1) * value.limit <= 2147483647, {
    path: ["page"],
    message: "La página solicitada excede el rango permitido",
  });

export type BookListQuery = z.infer<typeof bookListSchema>;

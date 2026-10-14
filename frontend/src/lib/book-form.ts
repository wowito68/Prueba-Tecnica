import type { BookInput } from "./books";

export function readBookForm(data: FormData): {
  input: BookInput;
  errors: Record<string, string>;
} {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const input: BookInput = {
    isbn: text("isbn"),
    titulo: text("titulo"),
    autor: text("autor"),
    genero: text("genero"),
    anio_publicacion: Number(text("anio_publicacion")),
    paginas: Number(text("paginas")),
    sinopsis: text("sinopsis") || null,
  };
  const errors: Record<string, string> = {};
  for (const [field, label, limit] of [
    ["isbn", "El ISBN", 80],
    ["titulo", "El título", 200],
    ["autor", "El autor", 160],
    ["genero", "El género", 80],
  ] as const) {
    if (!input[field]) errors[field] = `${label} es obligatorio`;
    else if (input[field].length > limit)
      errors[field] = `Máximo ${limit} caracteres`;
  }
  if (
    !text("anio_publicacion") ||
    !Number.isInteger(input.anio_publicacion) ||
    input.anio_publicacion < -2147483648
  )
    errors.anio_publicacion = "Introduce un año entero válido";
  else if (input.anio_publicacion > new Date().getFullYear())
    errors.anio_publicacion = "El año no puede ser mayor al actual";
  if (
    !text("paginas") ||
    !Number.isInteger(input.paginas) ||
    input.paginas <= 0 ||
    input.paginas > 2147483647
  )
    errors.paginas = "Introduce un número entero de páginas mayor a cero";
  if ((input.sinopsis?.length ?? 0) > 5000)
    errors.sinopsis = "Máximo 5000 caracteres";
  return { input, errors };
}

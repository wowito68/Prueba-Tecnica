import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Revisa los datos del formulario",
      errors: Object.fromEntries(
        error.issues.map((issue) => [issue.path[0] ?? "form", issue.message]),
      ),
    });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response
      .status(400)
      .json({ message: "El cuerpo de la petición debe ser JSON válido" });
    return;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 413
  ) {
    response.status(413).json({ message: "La petición es demasiado grande" });
    return;
  }
  console.error("Error inesperado", error);
  response
    .status(500)
    .json({ message: "No se pudo completar la petición. Inténtalo de nuevo" });
};

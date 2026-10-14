import type { RequestHandler } from "express";
import { env } from "../config/env";
import { HttpError } from "../lib/http-error";

export const checkOrigin: RequestHandler = (request, _response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  if (request.get("origin") !== new URL(env.FRONTEND_ORIGIN).origin) {
    throw new HttpError(403, "Origen de la petición no permitido");
  }
  next();
};

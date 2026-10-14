import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error";
import { sessionCookieName } from "../lib/session-cookie";
import { getSessionUser } from "../services/auth";

export const authenticate: RequestHandler = async (
  request,
  _response,
  next,
) => {
  const token: unknown = request.cookies?.[sessionCookieName];
  if (typeof token !== "string" || !token) {
    throw new HttpError(401, "Inicia sesión para continuar");
  }
  request.user = await getSessionUser(token);
  next();
};

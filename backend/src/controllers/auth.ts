import type { RequestHandler, Response } from "express";
import { env } from "../config/env";
import { sessionCookieName, sessionCookieOptions } from "../lib/session-cookie";
import { loginSchema, registerSchema } from "../schemas/auth";
import { createSessionToken, loginUser, registerUser } from "../services/auth";
import type { PublicUser } from "../repositories/user";

function sendSession(response: Response, user: PublicUser, status: number) {
  response.cookie(sessionCookieName, createSessionToken(user), {
    ...sessionCookieOptions,
    maxAge: env.SESSION_TTL_SECONDS * 1000,
  });
  response.status(status).json({ user });
}

export const register: RequestHandler = async (request, response) => {
  const user = await registerUser(registerSchema.parse(request.body));
  sendSession(response, user, 201);
};

export const login: RequestHandler = async (request, response) => {
  const user = await loginUser(loginSchema.parse(request.body));
  sendSession(response, user, 200);
};

export const logout: RequestHandler = (_request, response) => {
  response.clearCookie(sessionCookieName, sessionCookieOptions);
  response.status(204).end();
};

export const me: RequestHandler = (request, response) => {
  response.json({ user: request.user });
};

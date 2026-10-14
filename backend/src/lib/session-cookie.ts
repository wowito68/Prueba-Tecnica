import type { CookieOptions } from "express";
import { env } from "../config/env";

export const sessionCookieName = "club_session";

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/",
};

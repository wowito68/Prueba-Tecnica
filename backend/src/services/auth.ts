import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { userRepository, type PublicUser } from "../repositories/user";
import type { LoginInput, RegisterInput } from "../schemas/auth";

const jwtOptions = { issuer: "club-lectura", audience: "club-lectura-web" };
const dummyHash = bcrypt.hash("invalid-password-placeholder", 12);

export function createSessionToken(user: PublicUser) {
  return jwt.sign({}, env.JWT_SECRET, {
    ...jwtOptions,
    algorithm: "HS256",
    subject: user.id,
    expiresIn: env.SESSION_TTL_SECONDS,
  });
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    return await userRepository.create({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(409, "Ya existe una cuenta con ese correo");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await userRepository.findByEmail(input.email);
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!user || !passwordMatches) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }
  return { id: user.id, nombre: user.nombre, email: user.email };
}

export async function getSessionUser(token: string) {
  let subject: string;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      ...jwtOptions,
      algorithms: ["HS256"],
    });
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payload.sub,
      )
    ) {
      throw new Error("Token inválido");
    }
    subject = payload.sub;
  } catch {
    throw new HttpError(
      401,
      "La sesión expiró o no es válida. Inicia sesión de nuevo",
    );
  }
  const user = await userRepository.findPublicById(subject);
  if (!user) {
    throw new HttpError(401, "La sesión no es válida");
  }
  return user;
}

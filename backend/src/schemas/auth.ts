import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Introduce un correo válido").max(254));
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "La contraseña no puede superar 72 bytes",
  );

export const registerSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80),
    email,
    password,
  })
  .strict();

export const loginSchema = z.object({ email, password }).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

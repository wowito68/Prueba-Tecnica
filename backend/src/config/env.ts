import { z } from "zod";

export const demoJwtSecret = "solo-demo-local-cambiar-antes-de-produccion-2026";

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.url(),
    APP_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
    JWT_SECRET: z.string().min(32).default(demoJwtSecret),
    SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86400)
      .default(3600),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === "production" && value.JWT_SECRET === demoJwtSecret) {
      context.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "Configura un secreto propio en producción",
      });
    }
    if (value.APP_ENV === "production" && !value.COOKIE_SECURE) {
      context.addIssue({
        code: "custom",
        path: ["COOKIE_SECURE"],
        message: "Las cookies de producción requieren HTTPS",
      });
    }
  });

export const env = envSchema.parse(process.env);

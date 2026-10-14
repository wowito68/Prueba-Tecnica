import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();

const seedSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  SEED_DEMO: z.enum(["true", "false"]).default("true"),
  DEMO_USER_NAME: z.string().trim().min(1).default("Lector de prueba"),
  DEMO_USER_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email())
    .default("lector@example.com"),
  DEMO_USER_PASSWORD: z
    .string()
    .min(12)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "La contraseña no puede superar 72 bytes",
    )
    .default("LecturaDemo123!"),
});

const libros = [
  {
    isbn: "9788437604947",
    titulo: "Cien años de soledad",
    autor: "Gabriel García Márquez",
    genero: "Realismo mágico",
    anio_publicacion: 1967,
    paginas: 496,
    sinopsis:
      "La historia de la familia Buendía a lo largo de varias generaciones en Macondo.",
  },
  {
    isbn: "9788491050296",
    titulo: "El principito",
    autor: "Antoine de Saint-Exupéry",
    genero: "Fábula",
    anio_publicacion: 1943,
    paginas: 96,
    sinopsis:
      "Un pequeño viajero descubre la amistad y lo esencial a través de distintos planetas.",
  },
  {
    isbn: "9788423341981",
    titulo: "Pedro Páramo",
    autor: "Juan Rulfo",
    genero: "Novela",
    anio_publicacion: 1955,
    paginas: 160,
    sinopsis:
      "Juan Preciado llega a Comala en busca de su padre y encuentra las voces de su pasado.",
  },
];

async function seed() {
  const env = seedSchema.parse(process.env);

  if (env.SEED_DEMO === "false") {
    console.info("Seed de demostración desactivado");
    return;
  }

  if (env.APP_ENV === "production") {
    throw new Error(
      "El seed de demostración requiere APP_ENV=development o test",
    );
  }

  const passwordHash = await bcrypt.hash(env.DEMO_USER_PASSWORD, 12);

  await prisma.$transaction([
    prisma.usuario.upsert({
      where: { email: env.DEMO_USER_EMAIL },
      update: {},
      create: {
        nombre: env.DEMO_USER_NAME,
        email: env.DEMO_USER_EMAIL,
        passwordHash,
      },
    }),
    ...libros.map((libro) =>
      prisma.libro.upsert({
        where: { isbn: libro.isbn },
        update: {},
        create: libro,
      }),
    ),
  ]);

  console.info("Seed de demostración completado");
}

seed()
  .catch((error: unknown) => {
    console.error("No se pudo completar el seed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

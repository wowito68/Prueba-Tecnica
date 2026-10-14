import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function start() {
  await prisma.$connect();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.info(`Backend disponible en el puerto ${env.PORT}`);
  });

  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(() => {
      prisma
        .$disconnect()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch(async (error: unknown) => {
  console.error("No se pudo iniciar el backend", error);
  await prisma.$disconnect();
  process.exit(1);
});

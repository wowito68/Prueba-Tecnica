import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { bookRouter } from "./routes/book";
import { checkOrigin } from "./middleware/check-origin";
import { errorHandler } from "./middleware/error-handler";
import { healthRouter } from "./routes/health";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS === 1 ? 1 : false);
app.use(
  cors({ origin: new URL(env.FRONTEND_ORIGIN).origin, credentials: true }),
);
app.use(checkOrigin);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/books", bookRouter);
app.use((_request, response) => {
  response.status(404).json({ message: "Ruta no encontrada" });
});
app.use(errorHandler);

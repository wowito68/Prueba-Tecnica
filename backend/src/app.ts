import express from "express";
import { healthRouter } from "./routes/health";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/health", healthRouter);
app.use((_request, response) => {
  response.status(404).json({ message: "Ruta no encontrada" });
});

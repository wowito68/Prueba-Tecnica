import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, logout, me, register } from "../controllers/auth";
import { authenticate } from "../middleware/authenticate";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos. Espera unos minutos antes de continuar",
  },
});

authRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});
authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);

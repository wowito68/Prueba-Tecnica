import type { PublicUser } from "../repositories/user";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

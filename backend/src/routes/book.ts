import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
} from "../controllers/book";

export const bookRouter = Router();

bookRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});
bookRouter.use(authenticate);
bookRouter.get("/", listBooks);
bookRouter.get("/:id", getBook);
bookRouter.post("/", createBook);
bookRouter.put("/:id", updateBook);
bookRouter.delete("/:id", deleteBook);

import { Router } from "express";
import productCommentController from "../controllers/productComments.controller.js";
import authController from "../controllers/auth.controller.js";
const productCommentsRouter = Router();
productCommentsRouter.get('/', authController.checkAuth, productCommentController.getAll);
productCommentsRouter.post('/', authController.checkAuth, productCommentController.postOne);
productCommentsRouter.delete('/:id', authController.checkAuth, productCommentController.deleteOne);
export default productCommentsRouter;


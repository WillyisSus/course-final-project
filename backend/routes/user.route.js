import { Router } from "express";
import userController from "../controllers/user.controller.js";
import authController from "../controllers/auth.controller.js";

const userRouter = Router();

userRouter.get('/', userController.getAll);
userRouter.get('/account', authController.checkAuth, userController.getOne);
userRouter.post('/', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.postOne);
userRouter.put('/:id', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.putOne);
userRouter.delete('/:id', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.deleteOne);

export default userRouter;

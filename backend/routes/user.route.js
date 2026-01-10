import { Router } from "express";
import userController from "../controllers/user.controller.js";
import authController from "../controllers/auth.controller.js";
import { validate } from "../utils/validator.js";
import { adminResetUserPasswordSchema } from "../services/zodSchema.service.js";

const userRouter = Router();

userRouter.get('/', authController.checkAuth, authController.checkPermission(['ADMIN']), userController.getAll);
userRouter.get('/account', authController.checkAuth, userController.getOne);
userRouter.get('/:id', userController.findOneById);
userRouter.post('/', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.postOne);
userRouter.put('/:id', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.putOne);
userRouter.put('/:id/reset-password', authController.checkAuth, authController.checkPermission(["ADMIN"]), validate(adminResetUserPasswordSchema),userController.resetUserPassword);
userRouter.delete('/:id', authController.checkAuth, authController.checkPermission(["ADMIN"]), userController.deleteOne);

export default userRouter;

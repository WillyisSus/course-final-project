import { Router } from "express";
import upgradeRequestController from "../controllers/upgradeRequest.controller.js";
import authController from "../controllers/auth.controller.js";
import { validate } from "../utils/validator.js";
import { createUpgradeRequestSchema } from "../services/zodSchema.service.js";

const upgradeRequestRouter = Router();

upgradeRequestRouter.get('/', authController.checkAuth, authController.checkPermission(['ADMIN']), upgradeRequestController.getAll);
upgradeRequestRouter.get('/:id', authController.checkAuth, upgradeRequestController.getOne);  
upgradeRequestRouter.post('/', authController.checkAuth, validate(createUpgradeRequestSchema), upgradeRequestController.postOne);
upgradeRequestRouter.put('/:id', authController.checkAuth, upgradeRequestController.putOne);
upgradeRequestRouter.delete('/:id', authController.checkAuth, upgradeRequestController.deleteOne);
export default upgradeRequestRouter;
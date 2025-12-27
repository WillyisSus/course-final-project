import { Router } from "express";
import autoBidController from "../controllers/autoBids.controller.js";
import authController from "../controllers/auth.controller.js";
import { validate } from "../utils/validator.js";
import { createAutoBidSchema } from "../services/zodSchema.service.js";

const autoBidRouter = Router();
autoBidRouter.get('/', authController.checkAuth, autoBidController.getAutoBidOfUserForProduct);
autoBidRouter.post('/',authController.checkAuth, validate(createAutoBidSchema), autoBidController.postOne);
autoBidRouter.put('/:id', authController.checkAuth, autoBidController.putOne);
export default autoBidRouter;
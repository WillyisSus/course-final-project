import { Router } from "express";
import feedbackController from "../controllers/feedback.controller";
import authController from "../controllers/auth.controller";
import { createFeedbackSchema } from "../services/zodSchema.service";
import { validate } from "../utils/validator.js";
const feedbackRoute = Router();
feedbackRoute.get('/', authController.checkAuth, feedbackController.getAll);
feedbackRoute.post('/', authController.checkAuth, validate(createFeedbackSchema), feedbackController.postOne);
export default feedbackRoute;
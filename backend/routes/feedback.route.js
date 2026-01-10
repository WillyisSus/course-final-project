import { Router } from "express";
import feedbackController from "../controllers/feedback.controller.js";
import authController from "../controllers/auth.controller.js";
import { createFeedbackSchema } from "../services/zodSchema.service.js";
import { validate } from "../utils/validator.js";
const feedbackRoute = Router();
feedbackRoute.get('/', feedbackController.getAll);
feedbackRoute.post('/', authController.checkAuth, validate(createFeedbackSchema), feedbackController.postOne);
export default feedbackRoute;
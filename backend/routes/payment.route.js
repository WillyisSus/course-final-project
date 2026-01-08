import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import authController from "../controllers/auth.controller.js";
const paymentRouter = Router();
paymentRouter.use((req, res, next) => {
  authController.checkAuth(req, res, next);
});
paymentRouter.post('/create-order', paymentController.createOrder);
paymentRouter.post('/capture-order', paymentController.captureOrder);
export default paymentRouter;
import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import blockedBidderController from "../controllers/blockedBidder.controller.js";
const blockedBiddersRouter = Router();
blockedBiddersRouter.get('/', authController.checkAuth, authController.checkPermission(["ADMIN"]), blockedBidderController.getAll);
blockedBiddersRouter.get('/bidders', authController.checkAuth, blockedBidderController.getAllBlockedByUser);
blockedBiddersRouter.get('/products', authController.checkAuth, blockedBidderController.getAllBlockedByProduct);
blockedBiddersRouter.post('/unblock-bidder', authController.checkAuth, blockedBidderController.deleteOne);
export default blockedBiddersRouter;
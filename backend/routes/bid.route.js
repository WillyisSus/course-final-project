// Read-only route
import { Router } from "express";
import bidController from "../controllers/bid.controller.js";
const bidRouter = Router();
bidRouter.get('/', bidController.getAllBidsForProduct);
export default bidRouter;
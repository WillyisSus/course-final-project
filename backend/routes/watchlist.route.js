import watchlistController from "../controllers/watchlist.controller.js";
import { Router } from "express";
import authController from "../controllers/auth.controller.js";
const watchlistRouter = Router();

watchlistRouter.get('/', authController.checkAuth, watchlistController.getAll);
watchlistRouter.get('/:id', authController.checkAuth, watchlistController.getOne);
watchlistRouter.post('/', authController.checkAuth, watchlistController.postOne);
watchlistRouter.delete('/:id', authController.checkAuth, watchlistController.deleteOne);

export default watchlistRouter;
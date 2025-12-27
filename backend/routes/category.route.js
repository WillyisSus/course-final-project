import { Router } from "express";
import categoryController from "../controllers/category.controller.js";
const categoryRouter = Router();
categoryRouter.get('/', categoryController.getAll);
categoryRouter.get('/:id', categoryController.getOne);
categoryRouter.post('/', categoryController.postOne);
categoryRouter.put('/:id', categoryController.putOne);
categoryRouter.delete('/:id', categoryController.deleteOne);
export default categoryRouter;

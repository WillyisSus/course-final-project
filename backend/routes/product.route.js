import { Router } from "express";
import productController from "../controllers/product.controller.js";
import { upload } from "../utils/upload.js";
const productRouter = Router();

productRouter.get('/', productController.getAll);
productRouter.get('/:id', productController.getOne);
productRouter.post('/', upload.array("images", 4), productController.postOne);
productRouter.put('/:id', productController.putOne);
productRouter.delete('/:id', productController.deleteOne);
export default productRouter;
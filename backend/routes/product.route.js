import { Router } from "express";
import productController from "../controllers/product.controller.js";
import { upload } from "../utils/upload.js";
import authController from "../controllers/auth.controller.js";
const productRouter = Router();

productRouter.get('/', productController.getAll);
productRouter.get('/:id', productController.getOne);
productRouter.post('/', authController.checkAuth, upload.array("images", 4), productController.postOne);
productRouter.put('/:id', authController.checkAuth, productController.putOne);
productRouter.delete('/:id',authController.checkAuth, productController.deleteOne);
export default productRouter;
import { Router } from "express";
import productController from "../controllers/product.controller.js";
import { upload } from "../utils/upload.js";
import { createProductSchema, createBlockBidderSchema } from "../services/zodSchema.service.js";
import authController from "../controllers/auth.controller.js";
import { validate } from "../utils/validator.js";
const productRouter = Router();

productRouter.get('/', productController.getAll);
productRouter.get('/:id', productController.getOne);
productRouter.post('/', authController.checkAuth, authController.checkPermission(["ADMIN", "SELLER"]), upload.array("images", 4), validate(createProductSchema), productController.postOne);
productRouter.put('/:id', authController.checkAuth, productController.putOne);
productRouter.post('/:id/block', authController.checkAuth, validate(createBlockBidderSchema), productController.blockBidder);
productRouter.delete('/:id',authController.checkAuth, productController.deleteOne);
export default productRouter;
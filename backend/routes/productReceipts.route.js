import express from 'express';
import productReceiptController from '../controllers/productReceipts.controller.js';
import { validate } from '../utils/validator.js';
import {createProductReceiptSchema, updateProductReceiptSchema, receiptIdSchema} from '../services/zodSchema.service.js';
import { checkAuth } from '../controllers/auth.controller.js';

const productReceiptRouter = express.Router();
productReceiptRouter.use((req, res, next) => {
  checkAuth(req, res, next);
});

productReceiptRouter.get('/', productReceiptController.getAll);
productReceiptRouter.get('/:id', validate({ params: receiptIdSchema }), productReceiptController.getOne);
productReceiptRouter.post('/', validate(createProductReceiptSchema),productReceiptController.postOne);
productReceiptRouter.put('/:id', validate({ params: receiptIdSchema, body: updateProductReceiptSchema}), productReceiptController.putOne);
productReceiptRouter.delete('/:id', validate({ params: receiptIdSchema }), productReceiptController.deleteOne);

export default productReceiptRouter;

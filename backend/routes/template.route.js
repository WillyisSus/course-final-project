import {Router} from 'express';
import templateController from '../controllers/template.controller.js';
import authController from '../controllers/auth.controller.js';
const templateRouter = Router();

templateRouter.get('/', templateController.getAll)
templateRouter.get('/protected', authController.checkAuth, templateController.getAll)
templateRouter.get('/:id', templateController.getOne)
templateRouter.post('/', templateController.postOne)
templateRouter.put('/:id', templateController.putOne)
templateRouter.delete('/:id', templateController.deleteOne)
export default templateRouter;


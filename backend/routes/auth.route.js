import {Router} from 'express';
import { validate } from '../utils/validator.js';
import {loginSchema, registerUserSchema} from '../services/zodSchema.service.js'
import authController from '../controllers/auth.controller.js';
const authRoute = Router();

// authRoute.get('/users', authController.getAllUsers)
authRoute.post('/login', validate(loginSchema), authController.loginUser)
authRoute.post('/signup', validate(registerUserSchema), authController.signUp)
authRoute.post('/logout', authController.checkAuth, authController.logout)
// authRoute.post('/refreshToken', authController.refreshToken)

export default authRoute;


import {Router} from 'express';
import authController from '../controllers/auth.controller.js';
const authRoute = Router();

// authRoute.get('/users', authController.getAllUsers)
authRoute.post('/login', authController.loginUser)
// authRoute.post('/signup', authController.signUp)
// authRoute.post('/logout', authController.logout)
// authRoute.post('/refreshToken', authController.refreshToken)

export default authRoute;


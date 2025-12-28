import models from "../utils/db.js"
import { validate } from "../utils/validator.js";
import bcryptjs from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import jwt, { decode } from "jsonwebtoken";
import { UserService } from "../services/user.service.js";
const authController = {
    // treat this as a User model
    getAllUsers: async (req, res) => {
        try {
            const users = await models.users.findAll();
            res.status(200).send(users);
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },

    loginUser: async (req, res) => {
        try {
            if (req.error) {
                throw req.error;
            }
            console.log("Login Request Body:", req.body);
            const {email, password} = req.body;
            const user = await UserService.findUserByEmail(email, true);
            if (user==null) {
                return res.status(401).send({message: "Invalid username or password"})
            }
            const validPassword = await bcryptjs.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).send({message: "Invalid username or password"})
            }
            const payload = {
                user_id: user.user_id,
                role: user.role,
            }
            const accessToken = await generateToken.generateAccessToken(payload);
            const refresh_token = await generateToken.generateRefreshToken(payload);
            await UserService.updateUser(user.user_id, {refresh_token});
            res.status(200).send({message: "Login successful", accessToken, id: user.user_id})         
        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).send({message: "Internal Server error"})
        }
    },
    signUp: async (req, res) => {
        try {
            const {email, password, full_name} = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await UserService.createUser({
                email,
                password_hash: hashedPassword,
                full_name,
            });
            res.status(201).send({message: "User created successfully", data: newUser})
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },
    logout: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const refresh_token = null;
            await UserService.updateUser(userId, {refresh_token});
            res.status(200).send({message: "Logout successful"})
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },
    checkAuth: async (req, res, next) => {
        try {
            console.log
            const authHeader = req.headers['apikey'];
            console.log("Auth Header:", authHeader)
            const token = authHeader;
             console.log("Token:", token)
            if (token == null) {
                return res.status(401).json({ message: 'Access Denied. Token missing.' });
            }
           
            const {accessError, accessPayload} = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
                if (err) {
                    console.error("JWT Verification Error:", err);
                    if (err.name === 'TokenExpiredError') {
                        console.log("Access token has expired.");
                        decodedPayload = jwt.decode(token);
                    }
                    console.log("Decoded Payload:", decodedPayload);
                    return {accessError: err, accessPayload: decodedPayload};
                }
                req.user = decodedPayload;
                next();
            });
            if (accessError) {
                const refreshToken = await UserService.getRefreshTokenByUserId(accessPayload.user_id);
                const refreshError = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        console.error("Refresh Token Verification Error:", err);
                        return err;
                    }
                });
                if (refreshError) {
                    return res.status(403).json({ message: 'Invalid or expired token. Please login again' });
                }
                const newPayload = {
                    user_id: accessPayload.user_id,
                    role: accessPayload.role,
                }
                const newAccessToken = await generateToken.generateAccessToken(newPayload);
                res.setHeader('x-access-token', newAccessToken);
                req.user = newPayload;
                next();
            }
        } catch (error) {
            console.error("Error in checkAuth middleware:", error);
            return res.status(500).send({message: "Internal Server error"})
        }
    }
}

export default authController;
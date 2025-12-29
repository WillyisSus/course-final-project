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
            res.status(200).send({message: "Login successful", accessToken, user: {id: user.user_id, role: user.role, email: user.email, full_name: user.full_name}});         
        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).send({message: "Internal Server error"})
        }
    },
    signUp: async (req, res) => {
        try {
            const {email, password, full_name, dob, address} = req.body;
            const hashedPassword = await bcryptjs.hash(password, 10);
            const newUser = await UserService.createUser({
                email,
                password_hash: hashedPassword,
                full_name,
                dob,
                address
            });
            res.status(201).send({message: "User created successfully", data: newUser})
        } catch (error) {
            console.error("SignUp Error:", error);
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
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
                if (err) {
                    console.error("JWT Verification Error:", err);
                    if (err.name === 'TokenExpiredError') {
                        console.log("Access token has expired.");
                    }
                    return res.status(401).json({ message: 'Invalid or expired token. Please login again' });
                }
                req.user = decodedPayload;
                next();
            });
        } catch (error) {
            console.error("Error in checkAuth middleware:", error);
            return res.status(500).send({message: "Internal Server error"})
        }
    },
    refreshToken: async (req, res) => {
        try {
            const {user_id} = req.body;
            const refreshToken = await UserService.getRefreshTokenByUserId(user_id);
            const decodedPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    console.error("Refresh Token Verification Error:", err);
                    return res.status(401).json({ message: 'Invalid or expired token. Please login again' });
                }
                return decoded;
            });
            console.log("Decoded Payload from Refresh Token:", decodedPayload);
            const newPayload = {
                user_id: decodedPayload.userId,
                role: decodedPayload.role,
            }
            const newAccessToken = await generateToken.generateAccessToken(newPayload);
            return res.status(200).send({message: "Access Token refreshed sucessfully", accessToken: newAccessToken});
        } catch (error) {
            console.error("Error in refreshToken:", error);
            return res.status(500).send({message: "Internal Server error"})
        }
    }
}

export default authController;
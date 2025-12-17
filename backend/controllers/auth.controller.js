import models from "../utils/db.js"
import * as z from "zod";
import { validate } from "../utils/validator.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
const userSchema = z.object({
    username: z.string().min(3, {message: "Username must be at least 3 characters long"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"})
})

const account = {
    username: "username",
    password: "password"
}
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
           validate(userSchema)(req, res, async () => {
                const {username, password} = req.body;
                // const user = await models.users.findOne({
                //     where: {
                //         username: username,
                //     }
                // })
                // if (!user) {
                //     return res.status(401).send({message: "Invalid username or password"})
                // }
                // const validPassword = await bcrypt.compare(password, user.password);
                // if (!validPassword) {
                //     return res.status(401).send({message: "Invalid username or password"})
                // }
                if (username !== account.username || password !== account.password) {
                    return res.status(401).send({message: "Invalid username or password"})
                }
                const payload = {
                    userId: username,
                }
                const accessToken = await generateToken.generateAccessToken(payload);
                // const refreshToken = await generateToken.generateRefreshToken(payload);
            
                res.status(200).send({message: "Login successful", accessToken})         
                }       
            )
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },
    signUp: async (req, res) => {
        try {
            validate(userSchema)(req, res, async () => {
                const {username, password} = req.body;
                const user = await models.users.findOne({
                    where: {
                        username: username,
                    }
                })
                if (user) {
                    return res.status(401).send({message: "Exisiting username"})
                }
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                const newUSer = models.users.build({username, password: hashedPassword});
                await newUSer.save();
                res.status(200).send({message: "Sign up successful"})
            })
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },
    refreshToken: async (req, res) => {
        try {
            
        } catch (error) {
            res.status(500).send({message: "Internal Server error"})
        }
    },
    logout: async (req, res) => {
        try {
            
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
                    return res.status(403).json({ message: 'Invalid or expired token.' });
                }
                req.user = decodedPayload;
                next();
            });
        } catch (error) {
            console.error("Error in checkAuth middleware:", error);
            return res.status(500).send({message: "Internal Server error"})
        }
    }
}

export default authController;
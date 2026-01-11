import models from "../utils/db.js"
import { validate } from "../utils/validator.js";
import bcryptjs from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import jwt, { decode } from "jsonwebtoken";
import { UserService } from "../services/user.service.js";
import axios from "axios";
import {sendEmail, emailTemplates } from "../utils/email.js";
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
                return res.status(404).send({message: "Invalid username or password"})
            }
            const validPassword = await bcryptjs.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(404).send({message: "Invalid username or password"})
            }
            const payload = {
                user_id: user.user_id,
                role: user.role,
            }
            const accessToken = await generateToken.generateAccessToken(payload);
            const refresh_token = await generateToken.generateRefreshToken(payload);
            await UserService.updateUser(user.user_id, {refresh_token});
            res.status(200).send({message: "Login successful", 
                accessToken, 
                user: 
                {
                    user_id: user.user_id, 
                    role: user.role, 
                    email: user.email, 
                    address: user.address,
                    dob: user.dob,
                    full_name: user.full_name, 
                    is_verified: user.is_verified,
                    positive_rating: user.positive_rating,
                    negative_rating: user.negative_rating
                }});         
        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).send({message: "Internal Server error"})
        }
    },
    signUp: async (req, res) => {
        try {
            const {email, password, full_name, dob, address, recaptcha_token} = req.body;
            console.log("SignUp Request Body:", req.body);
            if (!recaptcha_token) {
                return res.status(400).json({ message: "Captcha token is missing." });
            }
            const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_SECRET_KEY}&response=${recaptcha_token}`;
            const captchaResponse = await axios.post(googleVerifyUrl)
            if (!captchaResponse.data.success) {
                return res.status(400).json({ message: "Captcha verification failed. Please try again." });
            }
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            const hashedPassword = await bcryptjs.hash(password, 10);
            const newUser = await UserService.createUser({
                email,
                password_hash: hashedPassword,
                full_name,
                dob,
                address,
                otp_code: otpCode,
                otp_expiry: otpExpiry
            });
            await sendEmail({
                to: email,
                ...emailTemplates.otpVerification(otpCode)
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
            const authHeader = req.headers['authorization'];
                
            console.log("Auth Header:", authHeader, "req.headers:", req.headers)
            const token = authHeader && authHeader.split(' ')[1];
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
                console.log("Decoded Payload checkAuth:", decodedPayload);
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
            const authHeader = req.headers['authorization'];
            const body = req.body;
            console.log("Auth Header:", authHeader)
            const token = authHeader && authHeader.split(' ')[1];
            console.log("Refresh Token Request Body:", body);   
            // Find user from expired access token
            if (token == null) {
                return res.status(401).json({ message: 'Access Denied. Token missing.' });
            }
            // Require client to send the expired access token
            const accessTokenPayload = jwt.decode(token);
            console.log("Decoded Access Token Payload:", accessTokenPayload);
            if (!accessTokenPayload.user_id) {
                return res.status(401).json({ message: 'Invalid token. User ID missing.' });
            }
            // Get access token from database
            const refreshToken = await UserService.getRefreshTokenByUserId(accessTokenPayload.user_id);
            const decodedPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    console.error("Refresh Token Verification Error:", err);
                    return res.status(401).json({ message: 'Invalid or expired token. Please login again' });
                }
                return decoded;
            });
            console.log("Decoded Payload from Refresh Token:", decodedPayload);
            const newPayload = {
                user_id: decodedPayload.user_id,
                role: decodedPayload.role,
            }
            const newAccessToken = await generateToken.generateAccessToken(newPayload);
            return res.status(200).send({message: "Access Token refreshed sucessfully", accessToken: newAccessToken});
        } catch (error) {
            console.error("Error in refreshToken:", error);
            return res.status(500).send({message: "Internal Server error"})
        }
    },
    checkPermission: (permission) => (req, res, next) =>{
        try {
            if (!permission || permission.length === 0) {
                next();
            }
            if (!req.user.role){
                return res.status(403).json({ message: "Forbidden. No role assigned." });
            }
            if (!permission.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden. You don't have permission" });
            }
            next();
        } catch (error) {
            
        }
    },
    
    verifyOTP: async (req, res) => {
        try {
        const { otp } = req.body;
        const userId = req.user.user_id; // From JWT Middleware
        console.log("Verifying OTP for User ID:", userId, "with OTP:", otp);
        const user = await UserService.findUserById(userId, false, true);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.is_verified) {
            return res.status(400).json({ message: "Account already verified" });
        }

        // Check Logic
        if (user.otp_code !== otp) {
            return res.status(400).json({ message: "Invalid OTP code" });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Success
        await UserService.updateUser(userId,{
            is_verified: true,
            otp_code: null,
            otp_expiry: null
        });
        res.json({ message: "Account verified successfully"});

        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    },
    sendOtp: async (req, res) => {
        try {
        const userId = req.user.user_id; // From JWT Middleware
        const user = await UserService.findUserById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.is_verified) {
            return res.status(400).json({ message: "Account already verified" });
        }

        // Check Logic
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await UserService.updateUser(userId, {
            otp_code: otpCode,
            otp_expiry: otpExpiry
        });
        await sendEmail({
            to: user.email,
            ...emailTemplates.otpVerification(otpCode)
        });
        res.json({ message: "OTP Sent"});

        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    },
    changePassword: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { old_password, new_password } = req.body;
            const user = await UserService.findUserById(userId, true);
            if (!user) return res.status(404).json({ message: "User not found" });
            const validPassword = await bcryptjs.compare(old_password, user.password_hash);
            if (!validPassword) {
                return res.status(400).json({ message: "Old password is incorrect" });
            }
            const hashedNewPassword = await bcryptjs.hash(new_password, 10);
            await UserService.updateUser(userId, { password_hash: hashedNewPassword });
            res.json({ message: "Password changed successfully" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const {email} = req.body;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }
            const user = await UserService.findUserByEmail(email, true);
            if (!user) return res.status(404).json({ message: "User not found" });
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 60 * 1000);
            await user.update({
                otp_code: otpCode,
                otp_expiry: otpExpiry
            });
            const {subject, html} = emailTemplates.forgotPasswordRequest(user.full_name, otpCode);
            await sendEmail({to: user.email, subject,  html});
            res.json({ message: "Password reset link sent to your email" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    updatePasswordDueToForgot: async (req, res) => {
        try {
            const { otp, email, new_password } = req.body;
            console.log("Resetting password for email:", email, "with OTP:", otp);
            if (!otp || !email || !new_password) {
                return res.status(400).json({ message: "Token, email and new password are required" });
            }
            const user = await UserService.findUserByEmail(email, true, true);
            if (user.otp_code !== otp) {
                console.log("Invalid OTP. Provided:", otp, "Expected:", user.otp_code);
                return res.status(400).json({ message: "Invalid OTP code" });
            }
            if (new Date() > new Date(user.otp_expiry)) {
                return res.status(400).json({ message: "OTP has expired" });
            }
            if (!user) return res.status(404).json({ message: "User not found" });
            const hashedNewPassword = await bcryptjs.hash(new_password, 10);
            await UserService.updateUser(user.user_id, { 
                otp_code: null,
                otp_expiry: null,
                password_hash: hashedNewPassword 
            });
            res.json({ message: "Password reset successfully" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    updateAccount: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const updateData = req.body;
            await UserService.updateUser(userId, updateData);
            res.json({ message: "Account updated successfully" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

}

export default authController;
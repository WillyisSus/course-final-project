import { UserService } from "../services/user.service.js";
import { emailTemplates, sendEmail } from "../utils/email.js";
import bcrypt from "bcryptjs";
const userController = {
    getAll: async (req, res) => {
        try {
            const users = await UserService.findAllUsers();
            res.json({ message: "Get all users", data: users});
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getOne: async (req, res) => {
        try {
            // Insert new code here
            const user = await UserService.findUserById(req.user.user_id);
            res.json({ message: `Get user with id ${req.user.user_id}`, data: user});
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    findOneById: async (req, res) => {
        try {
            const user = await UserService.findUserById(req.params.id);
            res.json({ message: `Get user with id ${req.params.id}`, data: user});
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    postOne: async (req, res) => {
        try {
            // Insert new code here
            res.status(201).json({ message: "User created" });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    putOne: async (req, res) => {
        try {
            res.json({ message: `User with id ${req.params.id} updated` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    resetUserPassword: async (req, res) => {
        try {
            const { new_password } = req.body;
            const hashedPassword = await bcrypt.hash(new_password, 10);
            
            const updatedUser =  await UserService.updateUser(req.params.id, { password_hash: hashedPassword });
            if (updatedUser) {
                const email = emailTemplates.resetPasswordByAdmin(
                    updatedUser.full_name,
                    new_password,
                );
                await sendEmail({to: updatedUser.email, subject: email.subject, html: email.html});
            }
            res.json({ message: `Password for user with id ${req.params.id} reset` });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    deleteOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `User with id ${req.params.id} deleted` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

}

export default userController;

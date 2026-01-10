import { UserService } from "../services/user.service.js";

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

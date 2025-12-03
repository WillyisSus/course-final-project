const templateController = {
    getAll: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: "Get all templates" });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Get template with id ${req.params.id}` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    postOne: async (req, res) => {
        try {
            // Insert new code here
            res.status(201).json({ message: "Template created" });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    putOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Template with id ${req.params.id} updated` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    deleteOne: async (req, res) => {
        try {
            // Insert new code here
            res.json({ message: `Template with id ${req.params.id} deleted` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

}

export default templateController;
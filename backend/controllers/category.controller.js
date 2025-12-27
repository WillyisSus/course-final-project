import { CategoryService } from '../services/category.service.js';

const categoryController = {
    // GET /api/categories
    getAll: async (req, res) => {
        try {
            const categories = await CategoryService.findAllCategories();
            res.json({ message: "Categories retrieved", data: categories });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/categories/:id
    getOne: async (req, res) => {
        try {
            const category = await CategoryService.findCategoryById(req.params.id);
            res.json({ message: "Category retrieved", data: category });
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },

    // POST /api/categories
    postOne: async (req, res) => {
        try {
            const { name, parent_id } = req.body;
            const newCategory = await CategoryService.createCategory(name, parent_id);
            res.status(201).json({ message: "Category created", data: newCategory });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/categories/:id
    putOne: async (req, res) => {
        try {
            const updatedCategory = await CategoryService.updateCategory(req.params.id, req.body);
            res.json({ message: "Category updated", data: updatedCategory });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // DELETE /api/categories/:id
    deleteOne: async (req, res) => {
        try {
            await CategoryService.deleteCategory(req.params.id);
            res.json({ message: "Category deleted" });
        } catch (error) {
            // CategoryService throws specific errors if products/subcats exist
            res.status(400).json({ message: error.message }); 
        }
    },
}

export default categoryController; 
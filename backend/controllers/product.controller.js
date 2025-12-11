import models from "../utils/db.js";
import * as z from "zod";
const productController = {
    getAllProducts: async (req, res) => {
        try {
            const products = await models.products.findAll({
                include: [{
                    model: models.product_images,
                    as: 'product_images',
                    required: false,
                },{
                    model: models.product_descriptions,
                    as: 'product_descriptions',
                    required: false,
                }]
            })
            res.json({message: `Found ${products.length} products`, data: products})
        } catch (error) {
            res.status(500).send({message: "Internal server error"})
            console.error(error);
        }
    },
    getProductById: async (req, res) => {
        try {
            const {id} = req.params;
            const product = await models.products.findByPk(id, {
                include: [{
                    model: models.product_images,
                    as: 'product_images',
                    required: false,
                },{
                    model: models.product_descriptions,
                    as: 'product_descriptions',
                    required: false,
                }]
            })
            if (!product) {
                return res.status(404).send({message: "Product not found"})
            }
            res.json({message: "Product found", data: product})
        } catch (error) {
            res.status(500).send({message: "Internal server error"})
        }
    }
}

export default productController;
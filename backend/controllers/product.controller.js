import models from "../utils/db.js";
import * as z from "zod";

const createProductSchema = z.object({
    seller_id: z.number().int().positive(),
    category_id: z.number().int().positive(),
    name: z.string().min(1).max(255),
    price_start: z.number().positive(),
    price_step: z.number().positive(),
    price_buy_now: z.number().positive().optional(),
    start_date: z.iso.datetime().or(z.date()),
    end_date: z.iso.datetime().or(z.date()),
    is_auto_extend: z.boolean().optional().default(false)
}).refine((data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end > start;
}, {
    message: "end_date must be after start_date",
    path: ["end_date"]
});

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const products = await models.products.findAll({
                include: [{
                    model: models.product_images,
                    as: 'product_images',
                    required: false,
                    where: { is_primary: true }
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
    },
    postOneProduct: async (req, res) => {
        try {
            const body = req.body;
            if (body){
                const parsedData = createProductSchema.parse(body);
                const newProduct = await models.products.create(parsedData);
                return res.status(201).json({message: "Product created", data: newProduct});
            }
            res.status(400).send({message: "Bad request"})
        }
        catch (error) {
            res.status(500).send({message: "Internal server error"})
        }
    },
    deleteOneProduct: async (req, res) => {
        try {
            const {id} = req.params;
            const deleted = await models.products.destroy({
                where: {id: id}
            });
            if (deleted) {
                return res.json({message: "Product deleted"});
            } else {
                return res.status(404).send({message: "Product not found"});
            }
        } catch (error) {
            res.status(500).send({message: "Internal server error"})
        }
    },
    
}

export default productController;
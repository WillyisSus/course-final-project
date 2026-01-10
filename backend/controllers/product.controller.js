import { check } from "zod";
import { BlockBidderService } from "../services/blockedBidders.service.js";
import { ProductService } from "../services/product.service.js";
import { ProductCommentService } from "../services/productComments.service.js";
import { ProductDescriptionService } from "../services/productDescription.service.js";
import { ProductImageService } from "../services/productImages.service.js";
import { UserService } from "../services/user.service.js";
import { emailTemplates, sendEmail } from "../utils/email.js";
const productController = {
    // GET /api/products
    getAll: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || null;
            const page = parseInt(req.query.page) || null;
            const offset = limit && page ? (page - 1) * limit: 0;
            
            const filters = {
                searchQuery: req.query.search || null,
                sortBy: req.query.sort || 'end_date', 
                sortOrder: req.query.order || 'ASC', 
                category: req.query.category || null, 
                status: req.query.status,
                sellerId: req.query.seller_id || null
            };
            const { count, rows } = await ProductService.findAllProducts({ 
                limit, 
                offset, 
                ...filters 
            });

            res.json({ 
                message: "Products retrieved successfully", 
                data: rows,
                meta: {
                    total: count,      
                    page: page,        
                    limit: limit,       
                    totalPages: Math.ceil(count / limit)
                }
        });

        } catch (error) {
            console.error("Error in getAll:", error);
            res.status(500).json({ message: error.message || "Internal Server Error" });
        }
    },
    getAllForAdmin: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || null;
            const page = parseInt(req.query.page) || null;
            const offset = limit && page ? (page - 1) * limit: 0;
            const filters = {
                searchQuery: req.query.search || null,
                sortBy: req.query.sort || 'end_date',
                sortOrder: req.query.order || 'ASC',
                category: req.query.category || null,
                status: req.query.status || null,
                sellerId: req.query.seller_id || null
            };
            const { count, rows } = await ProductService.findAllProducts({
                limit,
                offset,
                ...filters
            });
            res.json({
                message: "Products retrieved successfully",
                data: rows,
                meta: {
                    total: count,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(count / limit)
                }
        });
        } catch (error) {
            console.error("Error in getAllForAdmin:", error);
            res.status(500).json({ message: error.message || "Internal Server Error" });
        }
    },
    // GET /api/products/:id
    getOne: async (req, res) => {
        try {
            const product = await ProductService.findProductDetail(req.params.id);
            res.json({ 
                message: "Product details retrieved", 
                data: product 
            });
        } catch (error) {
            console.error("Error in getOne:", error);
            const status = error.message === 'Product not found' ? 404 : 500;
            res.status(status).json({ message: error.message });
        }
    },

    postOne: async (req, res) => {
        try {
            const sellerId = req.user?.user_id || 1; 
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "At least one product image is required." });
            }
            if (req.files.length > 4) {
                return res.status(400).json({ message: "Maximum 4 images allowed." });
            }
            console.log("Creating product for seller ID:", req.body );
            const newProduct = await ProductService.createProduct(req.body, sellerId);
            const imagePromises = req.files.map((file, index) => {
                const imageUrl = `http://localhost:3000/images/${file.filename}`;
                const isPrimary = index === 0;
                return ProductImageService.createImage(
                newProduct.product_id, 
                sellerId, 
                imageUrl, 
                isPrimary
                );
            });
            const product = await ProductDescriptionService.createDescription(newProduct.product_id, sellerId, req.body.description)
            await Promise.all(imagePromises);
            res.status(201).json({ 
                message: "Product and images created successfully", 
                data: newProduct 
            });

        } catch (error) {
            console.error("Error in postOne:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/products/:id
    putOne: async (req, res) => {
        try {
            const sellerId = req.user.user_id;
            const updatedProduct = await ProductService.updateProduct(req.params.id, sellerId, req.body);

            res.json({ 
                message: "Product updated successfully", 
                data: updatedProduct 
            });
        } catch (error) {
            console.error("Error in putOne:", error);
            const status = error.message.includes('Unauthorized') ? 403 : 500;
            res.status(status).json({ message: error.message });
        }
    },

    // DELETE /api/products/:id
    deleteOne: async (req, res) => {
        try {
            const sellerId = req.user.user_id;
            await ProductService.deleteProduct(req.params.id, sellerId);

            res.json({ message: "Product deleted successfully" });
        } catch (error) {
            console.error("Error in deleteOne:", error);
            const status = error.message.includes('Unauthorized') ? 403 : 500;
            res.status(status).json({ message: error.message });
        }
    },
    
    // Custom endpoint: POST /api/products/:id/block
    blockBidder: async (req, res) => {
        try {

            const sellerId = req.user.user_id;
            const { user_id, reason } = req.body;
            if (!user_id || reason === undefined || req.params.id === undefined) {
                return res.status(400).json({ message: "user_id and product_id are required" });
            }
            const result = await BlockBidderService.createBlock(req.params.id, sellerId, user_id, reason);
            const getDataToSendEmail = await ProductService.findProductById(req.params.id);
            const blockedUser = await UserService.findUserById(user_id);
            if (blockedUser && getDataToSendEmail) {
                const {subject, html} = emailTemplates.blockNotification(blockedUser.full_name, getDataToSendEmail.name, reason, req.params.id)
                await sendEmail({to: blockedUser.email, subject, html})
            }
            res.status(201).json({ message: "User blocked from this product", data: result });
        } catch (error) {
            console.error("Error in blockBidder:", error);
            res.status(400).json({ message: error.message });
        }
    },
    // Custom endpoint: POST /api/products/:id/description
    addDescription: async (req, res) => {
        try {
            const sellerId = req.user.user_id;
            const productId = req.params.id;
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({ message: "Description content is required" });
            }
            const result = await ProductDescriptionService.createDescription(productId, sellerId, content);
            res.status(201).json({ message: "Product description added", data: result });
        }
        catch (error) {
            console.error("Error in addDescription:", error);
            res.status(400).json({ message: error.message });
        }
    },
    checkBidderBlocked: async (req, res) => {
        try {
            const productId = req.params.id;
            const userId = req.user.user_id;
            const blockEntry = await BlockBidderService.findBlockEntry(productId, userId);
            res.json({ 
                message: "Block status retrieved", 
                data: blockEntry 
            });
        } catch (error) {
            console.error("Error in checkBidderBlocked:", error);
            res.status(500).json({ message: error.message });
        }
    }   
}

export default productController;
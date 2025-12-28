import { ProductService } from "../services/product.service.js";
import { ProductImageService } from "../services/productImages.service.js";
const productController = {
    // GET /api/products
    getAll: async (req, res) => {
        try {
            // Extract pagination from query (validated by your new validator middleware)
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;
            const searchQuery = req.query.search || null;
            const products = await ProductService.findActiveProducts({ limit, offset, searchQuery });
            if (products.length === 0) {
                return res.status(404).json({ message: "No active products found" });
            }
            res.json({ 
                message: "Active products retrieved successfully", 
                data: products 
            });
        } catch (error) {
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
            // differentiating 404 vs 500
            const status = error.message === 'Product not found' ? 404 : 500;
            res.status(status).json({ message: error.message });
        }
    },

    // POST /api/products
    postOne: async (req, res) => {
    try {
        const sellerId = req.user?.user_id || 1; // From auth middleware, default to 1 for testing
        
        // 1. Validation Check 
        // Ensure files exist if your logic requires them
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one product image is required." });
        }

        if (req.files.length > 4) {
            return res.status(400).json({ message: "Maximum 4 images allowed." });
        }

        // 2. Create Product Record
        // Multer has already populated req.body with the text fields
        const newProduct = await ProductService.createProduct(req.body, sellerId);
        
        // 3. Store Images Logic
        // We iterate over the files Multer saved
        const imagePromises = req.files.map((file, index) => {
            // Construct the URL/Path. 
            // If serving statically, it might look like: "http://localhost:3000/images/filename.jpg"
            // For now, we save the relative path or filename.
            const imageUrl = `/images/${file.filename}`;
            
            // Logic: First image is primary, others are not
            const isPrimary = index === 0;

            return ProductImageService.createImage(
            newProduct.product_id, 
            sellerId, 
            imageUrl, 
            isPrimary
            );
        });

        // Wait for all images to be saved in DB
        await Promise.all(imagePromises);

        // 4. Return success
        res.status(201).json({ 
            message: "Product and images created successfully", 
            data: newProduct 
        });

        } catch (error) {
        // Clean up: If DB insert fails, we should delete the uploaded files to save space
        if (req.files) {
            // fs.unlink logic can be added here
        }
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
            const status = error.message.includes('Unauthorized') ? 403 : 500;
            res.status(status).json({ message: error.message });
        }
    },
    
    // Custom endpoint: POST /api/products/:id/block
    blockBidder: async (req, res) => {
        try {
            const sellerId = req.user.user_id;
            const { userIdToBlock, reason } = req.body;
            
            const result = await ProductService.blockBidder(req.params.id, sellerId, userIdToBlock, reason);
            res.status(201).json({ message: "User blocked from this product", data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    
}

export default productController;